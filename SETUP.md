# browser-use — setup

[browser-use](https://github.com/browser-use/browser-use) lets AI agents control a real browser to complete tasks.

## Requirements

- Python 3.11+
- A Chromium/Chrome browser (installed automatically via Playwright)
- An LLM API key (OpenAI, Anthropic, Google, etc.)

## Install

```bash
# using pip
pip install -r requirements.txt

# or using uv
uv pip install -r requirements.txt

# install the browser (first run only)
python -m playwright install chromium
```

This project pins `browser-use==0.13.7`.

## Configure an LLM

Set the API key for your provider, e.g.:

```bash
export OPENAI_API_KEY=sk-...
# or ANTHROPIC_API_KEY / GOOGLE_API_KEY / ...
```

## Run the example

```bash
python example.py
```

## Verify the install

```bash
browser-use --version
browser-use --doctor   # diagnose install, daemon, and browser state
python -c "from browser_use import Agent, Browser; print('ok')"
```
