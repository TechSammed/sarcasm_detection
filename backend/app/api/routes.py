"""
API routes for sarcasm detection.

All business logic lives in the service layer.
Routes handle HTTP concerns only: parsing, status codes, rate limiting.
"""

from __future__ import annotations

from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.logging import get_logger
from app.services.classifier_service import ClassifierService
from app.api.schemas import (
    PredictRequest,
    PredictResponse,
    ExampleItem,
    HealthResponse,
)

logger = get_logger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Singleton service instance
_service: ClassifierService | None = None


def get_service() -> ClassifierService:
    """Lazy-init the classifier service."""
    global _service
    if _service is None:
        _service = ClassifierService()
    return _service


# ── Curated examples ─────────────────────────────────────────────────

CURATED_EXAMPLES: list[dict] = [
    {
        "text": "Oh great, another Monday. Just what I needed.",
        "context": None,
        "expected_label": "sarcastic",
    },
    {
        "text": "Thank you so much for helping me move, I really appreciate it.",
        "context": None,
        "expected_label": "not_sarcastic",
    },
    {
        "text": "Nice weather we're having.",
        "context": None,
        "expected_label": "uncertain",
    },
    {
        "text": "Wah bhai, kya timing hai teri. Flight miss kardi aur ab maza aa raha hai.",
        "context": None,
        "expected_label": "sarcastic",
    },
    {
        "text": "Love how my code works perfectly on the first try 🙃🔥",
        "context": None,
        "expected_label": "sarcastic",
    },
    {
        "text": "This is actually really good.",
        "context": "Friend cooked dinner for the first time and it turned out well.",
        "expected_label": "not_sarcastic",
    },
]


# ── Routes ────────────────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        422: {"description": "Validation error (empty input, too long)"},
        429: {"description": "Rate limited"},
        502: {"description": "Provider error (auth, network)"},
        504: {"description": "Provider timeout"},
    },
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def predict(request: Request, body: PredictRequest) -> PredictResponse:
    """Analyze a single text for sarcasm."""
    service = get_service()
    result = await service.classify(
        text=body.text,
        context=body.context,
        source=body.source,
    )
    return PredictResponse(**result)


@router.get(
    "/examples",
    response_model=list[ExampleItem],
)
async def get_examples() -> list[ExampleItem]:
    """Return curated example texts for the frontend."""
    return [ExampleItem(**ex) for ex in CURATED_EXAMPLES]


@router.get(
    "/health",
    response_model=HealthResponse,
)
async def health() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        provider="groq",
    )
