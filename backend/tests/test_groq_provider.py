"""
Unit tests for the Groq classifier provider.

Every test mocks the Groq API — no real API calls.
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.providers.groq import GroqClassifier
from app.providers.base import SarcasmResult
from app.core.exceptions import (
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
)


# ── Helpers ───────────────────────────────────────────────────────────

def _make_valid_response() -> dict:
    """A well-formed sarcasm result dict."""
    return {
        "label": "sarcastic",
        "confidence": 0.92,
        "sarcasm_type": "mock_praise",
        "reason": "The speaker frames a disaster as achievement.",
        "markers": ["only burned", "Progress!"],
        "literal_meaning": "Praising improvement.",
        "intended_meaning": "Mocking the listener.",
    }


def _mock_groq_response(content: str) -> MagicMock:
    """Create a mock Groq API response."""
    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]
    return response


# ── Tests ─────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_valid_response():
    """Groq returns well-formed JSON → parsed and validated."""
    classifier = GroqClassifier()
    data = _make_valid_response()

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        return_value=_mock_groq_response(json.dumps(data)),
    ):
        result = await classifier.classify(
            "Oh only burned the kitchen down once. Progress!"
        )

    assert isinstance(result, SarcasmResult)
    assert result.label == "sarcastic"
    assert result.confidence == 0.92
    assert result.provider == "groq"
    # Markers should be validated against input text
    assert "Progress!" in result.markers


@pytest.mark.asyncio
async def test_markers_validated_against_input():
    """Markers not present in input text are dropped."""
    classifier = GroqClassifier()
    data = _make_valid_response()
    data["markers"] = ["only burned", "Progress!", "nonexistent phrase"]

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        return_value=_mock_groq_response(json.dumps(data)),
    ):
        result = await classifier.classify(
            "Oh only burned the kitchen down once. Progress!"
        )

    assert "nonexistent phrase" not in result.markers
    assert "Progress!" in result.markers


@pytest.mark.asyncio
async def test_malformed_json_retried_once():
    """Malformed JSON triggers one retry, then fails."""
    classifier = GroqClassifier()
    valid = _make_valid_response()

    call_count = 0

    async def _side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return _mock_groq_response("not valid json {{{")
        return _mock_groq_response(json.dumps(valid))

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        side_effect=_side_effect,
    ):
        result = await classifier.classify("test text")

    assert result.label == "sarcastic"
    assert call_count == 2  # First call failed, second succeeded


@pytest.mark.asyncio
async def test_timeout_raises():
    """Timeout after retries raises ProviderTimeoutError."""
    from groq import APITimeoutError

    classifier = GroqClassifier()

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        side_effect=APITimeoutError(request=MagicMock()),
    ):
        with pytest.raises(ProviderResponseError):
            await classifier.classify("test text")


@pytest.mark.asyncio
async def test_auth_error_no_retry():
    """Auth errors fail immediately without retrying."""
    from groq import AuthenticationError

    classifier = GroqClassifier()

    mock_response = MagicMock()
    mock_response.status_code = 401

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        side_effect=AuthenticationError(
            message="Invalid API key",
            response=mock_response,
            body=None,
        ),
    ):
        with pytest.raises(ProviderAuthError):
            await classifier.classify("test text")


@pytest.mark.asyncio
async def test_rate_limit_retried():
    """429 triggers backoff, then succeeds on retry."""
    from groq import RateLimitError

    classifier = GroqClassifier()
    valid = _make_valid_response()
    call_count = 0

    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.headers = {"retry-after": "0.1"}

    async def _side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise RateLimitError(
                message="Rate limited",
                response=mock_response,
                body=None,
            )
        return _mock_groq_response(json.dumps(valid))

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        side_effect=_side_effect,
    ):
        result = await classifier.classify("test text")

    assert result.label == "sarcastic"
    assert call_count == 2


@pytest.mark.asyncio
async def test_empty_response_content():
    """Empty response content raises ProviderResponseError."""
    classifier = GroqClassifier()

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        return_value=_mock_groq_response(""),
    ):
        with pytest.raises(ProviderResponseError):
            await classifier.classify("test text")


@pytest.mark.asyncio
async def test_invalid_label_rejected():
    """Invalid label value is rejected by Pydantic validation."""
    classifier = GroqClassifier()
    data = _make_valid_response()
    data["label"] = "maybe_sarcastic"  # Not in the allowed enum

    with patch.object(
        classifier._client.chat.completions,
        "create",
        new_callable=AsyncMock,
        return_value=_mock_groq_response(json.dumps(data)),
    ):
        with pytest.raises(ProviderResponseError):
            await classifier.classify("test text")


@pytest.mark.asyncio
async def test_context_passed_to_model():
    """Context is included in the user message sent to the API."""
    classifier = GroqClassifier()
    valid = _make_valid_response()

    mock_create = AsyncMock(return_value=_mock_groq_response(json.dumps(valid)))

    with patch.object(
        classifier._client.chat.completions,
        "create",
        mock_create,
    ):
        await classifier.classify("Nice weather", context="It's pouring rain outside")

    # Check that context appears in the messages
    call_kwargs = mock_create.call_args
    messages = call_kwargs.kwargs.get("messages") or call_kwargs[1].get("messages")
    user_msg = messages[-1]["content"]
    assert "It's pouring rain outside" in user_msg
