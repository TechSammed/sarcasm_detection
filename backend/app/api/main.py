"""
FastAPI application factory and exception handlers.

This is the main entry point for `uvicorn backend.app.api.main:app`.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.exceptions import (
    EmptyInputError,
    InputTooLongError,
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderResponseError,
    ProviderTimeoutError,
    SarcasmDetectorError,
)
from app.api.routes import router, limiter

# ── Bootstrap logging ─────────────────────────────────────────────────
setup_logging(settings.log_level)
logger = get_logger(__name__)

# ── Application ───────────────────────────────────────────────────────
app = FastAPI(
    title="Sarcasm Detector API",
    description="Detect sarcasm in text using the Groq API.",
    version="1.0.0",
)

# ── Middleware ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate limiter ──────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Routes ────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api")


# ── Exception handlers ────────────────────────────────────────────────

@app.exception_handler(EmptyInputError)
async def _handle_empty_input(_req: Request, exc: EmptyInputError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(InputTooLongError)
async def _handle_too_long(_req: Request, exc: InputTooLongError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(ProviderAuthError)
async def _handle_auth(_req: Request, exc: ProviderAuthError) -> JSONResponse:
    logger.error("Auth error: %s", exc)
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.exception_handler(ProviderRateLimitError)
async def _handle_rate_limit(_req: Request, exc: ProviderRateLimitError) -> JSONResponse:
    headers = {}
    if exc.retry_after is not None:
        headers["Retry-After"] = str(int(exc.retry_after))
    return JSONResponse(
        status_code=429,
        content={"detail": str(exc)},
        headers=headers,
    )


@app.exception_handler(ProviderTimeoutError)
async def _handle_timeout(_req: Request, exc: ProviderTimeoutError) -> JSONResponse:
    return JSONResponse(status_code=504, content={"detail": str(exc)})


@app.exception_handler(ProviderResponseError)
async def _handle_response_error(_req: Request, exc: ProviderResponseError) -> JSONResponse:
    logger.error("Provider response error: %s", exc)
    return JSONResponse(status_code=502, content={"detail": str(exc)})


@app.exception_handler(SarcasmDetectorError)
async def _handle_generic(_req: Request, exc: SarcasmDetectorError) -> JSONResponse:
    logger.error("Unhandled app error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": str(exc)})


# ── Startup event ─────────────────────────────────────────────────────

@app.on_event("startup")
async def _startup() -> None:
    logger.info("Sarcasm Detector API starting up ...")
    logger.info("Provider: groq (%s)", settings.groq_model)
    logger.info("CORS origins: %s", settings.cors_origins)
    logger.info("Rate limit: %d req/min per IP", settings.rate_limit_per_minute)
