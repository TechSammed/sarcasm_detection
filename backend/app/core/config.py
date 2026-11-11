"""
Application configuration loaded from environment variables.

Uses pydantic-settings for validation and type coercion.
All values can be overridden via .env file or environment variables.
"""

from __future__ import annotations

from pathlib import Path
from typing import Union, List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve project root: backend/ is one level up from app/core/
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent


class Settings(BaseSettings):
    """Central configuration for the sarcasm-detector backend."""

    model_config = SettingsConfigDict(
        env_file=str(_PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Groq API ──────────────────────────────────────────────────────
    groq_api_key: str = Field(..., description="Groq API key (never logged)")
    groq_model: str = Field(
        "openai/gpt-oss-safeguard-20b",
        description="Model ID on Groq",
    )
    groq_temperature: float = Field(0.1, ge=0.0, le=2.0)
    groq_timeout: int = Field(30, ge=5, le=120, description="Request timeout in seconds")
    groq_max_retries: int = Field(3, ge=1, le=10)

    # ── CORS ──────────────────────────────────────────────────────────
    cors_origins: Union[str, List[str]] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
    )

    # ── Rate limiting ─────────────────────────────────────────────────
    rate_limit_per_minute: int = Field(30, ge=1)

    # ── Logging ───────────────────────────────────────────────────────
    log_level: str = Field("INFO")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v: object) -> List[str]:
        """Accept comma-separated string or list."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return list(v)  # type: ignore[arg-type]

    @field_validator("log_level", mode="before")
    @classmethod
    def _upper_log_level(cls, v: str) -> str:
        return v.upper()


# Singleton – import this everywhere.
settings = Settings()  # type: ignore[call-arg]
