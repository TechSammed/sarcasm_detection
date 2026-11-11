"""
Integration tests for the FastAPI endpoints.

Uses TestClient — all provider calls are mocked.
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from fastapi.testclient import TestClient

from app.providers.base import SarcasmResult


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


@pytest.fixture
def client():
    """Create a test client with mocked service."""
    from app.api.main import app
    return TestClient(app)


def test_health(client):
    """GET /api/health returns 200 with status."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


def test_get_examples(client):
    """GET /api/examples returns a list of curated samples."""
    resp = client.get("/api/examples")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    assert "text" in data[0]
    assert "expected_label" in data[0]


def test_predict_empty_text(client):
    """POST /api/predict with empty text returns 422."""
    resp = client.post("/api/predict", json={"text": ""})
    assert resp.status_code == 422


def test_predict_too_long(client):
    """POST /api/predict with > 1000 chars returns 422."""
    resp = client.post("/api/predict", json={"text": "a" * 1001})
    assert resp.status_code == 422


def test_predict_success(client):
    """POST /api/predict with valid text returns prediction."""
    mock_result = _make_result()

    with patch(
        "app.api.routes.get_service",
    ) as mock_get_svc:
        mock_svc = MagicMock()
        mock_svc.classify = AsyncMock(return_value={
            **mock_result.model_dump(),
            "source": "text",
            "latency_ms": 42.5,
        })
        mock_get_svc.return_value = mock_svc

        resp = client.post("/api/predict", json={
            "text": "Oh sure, that's a great idea",
            "source": "text",
        })

    assert resp.status_code == 200
    data = resp.json()
    assert data["label"] == "sarcastic"
    assert data["provider"] == "groq"
    assert "latency_ms" in data


def test_predict_with_context(client):
    """POST /api/predict passes context through."""
    mock_result = _make_result()

    with patch(
        "app.api.routes.get_service",
    ) as mock_get_svc:
        mock_svc = MagicMock()
        mock_svc.classify = AsyncMock(return_value={
            **mock_result.model_dump(),
            "source": "text",
            "latency_ms": 50.0,
        })
        mock_get_svc.return_value = mock_svc

        resp = client.post("/api/predict", json={
            "text": "Nice weather",
            "context": "It's pouring rain",
            "source": "text",
        })

    assert resp.status_code == 200
    mock_svc.classify.assert_called_once()
    call_kwargs = mock_svc.classify.call_args.kwargs
    assert call_kwargs["context"] == "It's pouring rain"


def test_batch_success(client):
    """POST /api/predict/batch returns results for each item."""
    mock_result = _make_result()

    with patch(
        "app.api.routes.get_service",
    ) as mock_get_svc:
        mock_svc = MagicMock()
        mock_svc.classify_batch = AsyncMock(return_value=[
            {**mock_result.model_dump(), "source": "text", "latency_ms": 40.0},
            {**mock_result.model_dump(), "source": "text", "latency_ms": 45.0},
        ])
        mock_get_svc.return_value = mock_svc

        resp = client.post("/api/predict/batch", json={
            "items": [
                {"text": "Oh sure"},
                {"text": "Thanks for your help"},
            ]
        })

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["results"]) == 2
