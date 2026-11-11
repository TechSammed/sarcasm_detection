"""
Sarcasm classification result model.

Used by the Groq provider and the service layer.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class SarcasmResult(BaseModel):
    """Validated result from the sarcasm classifier."""

    is_sarcastic: bool = Field(..., description="Whether the text is sarcastic")
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: str = Field(
        ..., max_length=500, description="Why the text is or isn't sarcastic"
    )
    provider: str = Field(default="groq", description="Provider that generated this result")
