"""
Shared test fixtures and configuration.

All Groq API calls are mocked — no real API calls in tests.
"""

from __future__ import annotations

import os
import pytest

# Ensure test env vars are set BEFORE any app imports
os.environ.setdefault("GROQ_API_KEY", "gsk_test_key_not_real")
os.environ.setdefault("GROQ_MODEL", "openai/gpt-oss-safeguard-20b")
os.environ.setdefault("LOG_LEVEL", "WARNING")
