"""Minimal browser-use example.

Runs an AI agent that controls a real browser to complete a task.

Prerequisites:
    pip install -r requirements.txt
    # Set an LLM API key, e.g.:
    export OPENAI_API_KEY=sk-...
    # or ANTHROPIC_API_KEY, GOOGLE_API_KEY, etc.

Run:
    python example.py
"""

import asyncio
import os

from browser_use import Agent
from browser_use.llm import ChatOpenAI


async def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit(
            "Set OPENAI_API_KEY (or configure another provider) before running."
        )

    agent = Agent(
        task="Go to example.com and report the main heading on the page.",
        llm=ChatOpenAI(model="gpt-4o-mini"),
    )
    result = await agent.run()
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
