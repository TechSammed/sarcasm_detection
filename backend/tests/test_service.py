"""
Unit tests for the classifier service layer.

Tests validation, fallback logic, and error propagation.
All provider calls are mocked.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.classifier_service import ClassifierService
from app.providers.base import SarcasmResult
from app.core.exceptions import (
    EmptyInputError,
    InputTooLongError,
    ProviderResponseError,
    FallbackExhaustedError,
)


def _make_result(provider: str = "groq") -> SarcasmResult:
    return SarcasmResult(
        label="sarcastic",
        confidence=0.9,
        sarcasm_type="deadpan",
        reason="Test reason.",
        markers=["test"],
        literal_meaning="Literal.",
        intended_meaning="Intended.",
        provider=provider,
    )


@pytest.mark.asyncio
async def test_empty_input_raises():
    """Empty or whitespace-only text raises EmptyInputError."""
    service = ClassifierService()
    with pytest.raises(EmptyInputError):
        await service.classify(text="   ", source="text")


@pytest.mark.asyncio
async def test_input_too_long_raises():
    """Text exceeding 1000 chars raises InputTooLongError."""
    service = ClassifierService()
    with pytest.raises(InputTooLongError):
        await service.classify(text="a" * 1001, source="text")


@pytest.mark.asyncio
async def test_successful_classification():
    """Happy path: primary provider returns a valid result."""
    service = ClassifierService()
    mock_result = _make_result("groq")

    with patch.object(
        service._primary,
        "classify",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        result = await service.classify(text="Oh sure", source="text")

    assert result["label"] == "sarcastic"
    assert result["provider"] == "groq"
    assert "latency_ms" in result


@pytest.mark.asyncio
async def test_fallback_used_when_primary_fails():
    """When primary fails and fallback is enabled, fallback is used."""
    service = ClassifierService()
    fallback_result = _make_result("bert_fallback")

    # Create a mock fallback
    mock_fallback = MagicMock()
    mock_fallback.name = "bert_fallback"
    mock_fallback.classify = AsyncMock(return_value=fallback_result)
    service._fallback = mock_fallback

    with patch.object(
        service._primary,
        "classify",
        new_callable=AsyncMock,
        side_effect=ProviderResponseError("groq", "API error"),
    ):
        result = await service.classify(text="test text", source="text")

    assert result["provider"] == "bert_fallback"


@pytest.mark.asyncio
async def test_fallback_exhausted_raises():
    """When both providers fail, FallbackExhaustedError is raised."""
    service = ClassifierService()

    mock_fallback = MagicMock()
    mock_fallback.name = "bert_fallback"
    mock_fallback.classify = AsyncMock(
        side_effect=ProviderResponseError("bert_fallback", "Model load error")
    )
    service._fallback = mock_fallback

    with patch.object(
        service._primary,
        "classify",
        new_callable=AsyncMock,
        side_effect=ProviderResponseError("groq", "API error"),
    ):
        with pytest.raises(FallbackExhaustedError):
            await service.classify(text="test text", source="text")


@pytest.mark.asyncio
async def test_latency_tracked():
    """Result includes latency_ms field."""
    service = ClassifierService()
    mock_result = _make_result("groq")

    with patch.object(
        service._primary,
        "classify",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        result = await service.classify(text="test", source="text")

    assert isinstance(result["latency_ms"], float)
    assert result["latency_ms"] >= 0
