"""
Application-specific exceptions.

Each exception maps to a specific HTTP status code via the FastAPI
error handlers in api/main.py.
"""

from __future__ import annotations


class SarcasmDetectorError(Exception):
    """Base exception for the sarcasm detector."""


class EmptyInputError(SarcasmDetectorError):
    """Raised when the input text is empty or whitespace-only."""

    def __init__(self, msg: str = "Input text must not be empty.") -> None:
        super().__init__(msg)


class InputTooLongError(SarcasmDetectorError):
    """Raised when input exceeds the maximum character limit."""

    def __init__(self, length: int, max_length: int = 1000) -> None:
        super().__init__(
            f"Input too long: {length} chars (max {max_length})."
        )
        self.length = length
        self.max_length = max_length


class ProviderError(SarcasmDetectorError):
    """Base for inference-provider errors."""


class ProviderTimeoutError(ProviderError):
    """Upstream provider timed out."""

    def __init__(self, provider: str, timeout: int) -> None:
        super().__init__(f"{provider} timed out after {timeout}s.")
        self.provider = provider
        self.timeout = timeout


class ProviderRateLimitError(ProviderError):
    """Upstream provider returned 429."""

    def __init__(self, provider: str, retry_after: float | None = None) -> None:
        msg = f"{provider} rate-limited."
        if retry_after is not None:
            msg += f" Retry after {retry_after:.1f}s."
        super().__init__(msg)
        self.provider = provider
        self.retry_after = retry_after


class ProviderAuthError(ProviderError):
    """Invalid or missing API key."""

    def __init__(self, provider: str) -> None:
        super().__init__(f"{provider} authentication failed. Check your API key.")
        self.provider = provider


class ProviderResponseError(ProviderError):
    """Provider returned malformed or invalid data."""

    def __init__(self, provider: str, detail: str) -> None:
        super().__init__(f"{provider} returned invalid data: {detail}")
        self.provider = provider
        self.detail = detail
