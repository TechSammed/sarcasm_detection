"""
Groq-based sarcasm classifier (sole provider).

Uses the OpenAI-compatible Groq API with a minimal
classification prompt and JSON output.
"""

from __future__ import annotations

import json
import asyncio
from typing import Any, Optional

from groq import (
    AsyncGroq,
    APITimeoutError,
    RateLimitError,
    AuthenticationError,
    APIError,
)

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import (
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
)
from app.providers.base import SarcasmResult

logger = get_logger(__name__)

# ── Minimal system instruction (~40 tokens) ───────────────────────────
_SYSTEM_PROMPT = (
    "Classify the user's text as sarcastic or not. "
    "Respond with JSON only: "
    '{"is_sarcastic": true or false, "confidence": 0.0 to 1.0, "explanation": "brief reason"}'
)


class GroqClassifier:
    """Sole inference provider via Groq API."""

    def __init__(self) -> None:
        self._client = AsyncGroq(
            api_key=settings.groq_api_key,
            timeout=float(settings.groq_timeout),
            max_retries=0,  # We handle retries ourselves
        )

    async def _call_api(
        self, text: str, context: Optional[str] = None
    ) -> dict[str, Any]:
        """Make a single API call and return parsed JSON."""
        user_content = text
        if context:
            user_content = f"{text}\n\nContext: {context}"

        messages = [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ]

        try:
            response = await self._client.chat.completions.create(
                model=settings.groq_model,
                messages=messages,
                temperature=settings.groq_temperature,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
        except APITimeoutError as exc:
            raise ProviderTimeoutError("groq", settings.groq_timeout) from exc
        except RateLimitError as exc:
            retry_after = None
            if hasattr(exc, "response") and exc.response is not None:
                raw = exc.response.headers.get("retry-after")
                if raw:
                    try:
                        retry_after = float(raw)
                    except (ValueError, TypeError):
                        pass
            raise ProviderRateLimitError("groq", retry_after) from exc
        except AuthenticationError as exc:
            raise ProviderAuthError("groq") from exc
        except APIError as exc:
            raise ProviderResponseError("groq", str(exc)) from exc

        content = response.choices[0].message.content
        if not content:
            raise ProviderResponseError("groq", "Empty response content")

        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise ProviderResponseError("groq", f"Invalid JSON: {exc}") from exc

    async def classify(
        self, text: str, context: Optional[str] = None
    ) -> SarcasmResult:
        """
        Classify text with retries for transient failures only.

        Retry strategy:
        - 429 (rate limit): fail immediately (resending won't help).
        - Malformed JSON: one retry.
        - Timeout: retry with backoff.
        - Auth error: fail immediately.
        """
        last_error: Exception | None = None
        json_retry_used = False

        for attempt in range(1, settings.groq_max_retries + 1):
            try:
                raw = await self._call_api(text, context)
                result = SarcasmResult(provider="groq", **raw)
                logger.info(
                    "Groq classified as %s (%.2f) on attempt %d",
                    "sarcastic" if result.is_sarcastic else "not_sarcastic",
                    result.confidence,
                    attempt,
                )
                return result

            except ProviderAuthError:
                raise  # No retry for auth failures

            except ProviderRateLimitError:
                raise  # Don't retry rate limits

            except ProviderResponseError as exc:
                if json_retry_used:
                    raise
                json_retry_used = True
                last_error = exc
                logger.warning(
                    "Malformed response (attempt %d/%d): %s. Retrying once.",
                    attempt,
                    settings.groq_max_retries,
                    exc,
                )
                await asyncio.sleep(0.5)

            except ProviderTimeoutError as exc:
                last_error = exc
                wait = 2 ** (attempt - 1)
                logger.warning(
                    "Timeout (attempt %d/%d). Waiting %ds.",
                    attempt,
                    settings.groq_max_retries,
                    wait,
                )
                await asyncio.sleep(wait)

            except Exception as exc:
                last_error = exc
                logger.error("Unexpected error on attempt %d: %s", attempt, exc)
                await asyncio.sleep(1)

        raise ProviderResponseError(
            "groq",
            f"All {settings.groq_max_retries} attempts failed. Last error: {last_error}",
        )
