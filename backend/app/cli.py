"""
CLI client for sarcasm detection.

Thin wrapper around the classifier service.
Supports text input via an interactive menu.
"""

from __future__ import annotations

import asyncio

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.services.classifier_service import ClassifierService

logger = get_logger(__name__)

BANNER = """
╔══════════════════════════════════════════╗
║         🔍  Sarcasm Detector  🔍         ║
║                                          ║
║   Provider: {provider:<27s}║
╚══════════════════════════════════════════╝
"""


def _print_result(result: dict) -> None:
    """Pretty-print a classification result."""
    verdict = "Sarcastic 😏" if result["is_sarcastic"] else "Not Sarcastic 🙂"

    print(f"\n  Verdict:     {verdict}")
    print(f"  Confidence:  {result['confidence']:.0%}")
    print(f"  Explanation: {result['explanation']}")
    print(f"  Provider:    {result['provider']}")
    print(f"  Latency:     {result['latency_ms']}ms")


async def _main() -> None:
    """Interactive CLI loop."""
    setup_logging(settings.log_level)

    service = ClassifierService()

    print(BANNER.format(provider=settings.groq_model))

    while True:
        print("\n  1. Text input")
        print("  2. Exit")

        choice = input("\n  Choose (1/2): ").strip()

        if choice == "1":
            text = input("  Enter text: ").strip()
            if not text:
                print("  ⚠ Empty input.")
                continue

            context = input("  Context (optional, press Enter to skip): ").strip() or None

            try:
                result = await service.classify(text=text, context=context, source="text")
                _print_result(result)
            except Exception as exc:
                print(f"\n  ❌ Error: {exc}")

        elif choice == "2":
            print("\n  Goodbye! 👋")
            break

        else:
            print("  ⚠ Invalid choice.")


def main() -> None:
    """Entry point for the CLI."""
    asyncio.run(_main())


if __name__ == "__main__":
    main()
