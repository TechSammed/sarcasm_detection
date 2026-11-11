"""
Classifier service — the central business-logic layer.

Orchestrates input validation and Groq classification.
All entry points (API, CLI) use this.
"""

from __future__ import annotations

import time
from typing import Optional

from app.core.logging import get_logger
from app.core.exceptions import EmptyInputError, InputTooLongError
from app.providers.groq import GroqClassifier

logger = get_logger(__name__)

MAX_TEXT_LENGTH = 1000


class ClassifierService:
    """Orchestrates sarcasm classification via Groq API."""

    def __init__(self) -> None:
        self._classifier = GroqClassifier()

    @staticmethod
    def _validate_input(text: str) -> str:
        """Validate and clean input text."""
        cleaned = text.strip()
        if not cleaned:
            raise EmptyInputError()
        if len(cleaned) > MAX_TEXT_LENGTH:
            raise InputTooLongError(len(cleaned), MAX_TEXT_LENGTH)
        return cleaned

    async def classify(
        self,
        text: str,
        context: Optional[str] = None,
        source: str = "text",
    ) -> dict:
        """
        Classify a single text. Returns a dict with the result + metadata.

        Args:
            text: The statement to analyze.
            context: Optional surrounding context.
            source: Input source ('text' or 'voice').

        Returns:
            Dict with SarcasmResult fields + source + latency_ms.
        """
        cleaned = self._validate_input(text)
        clean_context = context.strip() if context else None

        start = time.perf_counter()
        result = await self._classifier.classify(cleaned, clean_context)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 1)

        return {
            **result.model_dump(),
            "source": source,
            "latency_ms": elapsed_ms,
        }
