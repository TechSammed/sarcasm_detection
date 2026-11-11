"""
Pydantic request/response schemas for the FastAPI endpoints.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── Requests ──────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """Single sarcasm prediction request."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="The statement to analyze (max 1000 chars).",
    )
    context: Optional[str] = Field(
        None,
        max_length=1000,
        description="Optional context: previous message or situation.",
    )
    source: str = Field(
        "text",
        pattern=r"^(text|voice)$",
        description="Input source: 'text' or 'voice'.",
    )


# ── Responses ─────────────────────────────────────────────────────────

class PredictResponse(BaseModel):
    """Single prediction response."""

    is_sarcastic: bool
    confidence: float
    explanation: str
    provider: str
    source: str
    latency_ms: float


class ExampleItem(BaseModel):
    """A curated example for the /examples endpoint."""

    text: str
    context: Optional[str] = None
    expected_label: str


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    provider: str


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
