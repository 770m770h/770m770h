"""Shared types + helpers for skill-scout. Stdlib only - portable, no pip deps."""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Optional

USER_AGENT = "skill-scout/0.1 (+https://github.com/Brain-ai-biz/skill-scout)"
HTTP_TIMEOUT = 20


@dataclass
class Candidate:
    """One discovered extension, normalized across every source."""
    name: str
    ecosystem: str = "skill"
    source: str = ""
    repo_url: str = ""
    description: str = ""
    outputs: str = ""
    stars: int = 0
    installs: int = 0
    last_updated: str = ""
    license: str = ""
    publisher: str = ""
    official: bool = False
    verified: bool = False
    archived: bool = False
    requires_code_execution: Optional[bool] = None
    homepage: str = ""
    score: Optional[int] = None
    score_reason: str = ""
    extra: dict = field(default_factory=dict)

    def key(self) -> str:
        r = normalize_repo(self.repo_url)
        return r or f"{self.ecosystem}:{self.name.strip().lower()}"

    def to_dict(self) -> dict:
        return asdict(self)


def normalize_repo(url: str) -> str:
    if not url:
        return ""
    m = re.search(r"github\.com[:/]+([^/]+)/([^/#?]+)", url, re.I)
    if not m:
        return ""
    owner, repo = m.group(1), m.group(2)
    repo = re.sub(r"\.git$", "", repo)
    return f"{owner.lower()}/{repo.lower()}"


def http_get_json(url: str, params: dict | None = None,
                  headers: dict | None = None) -> Optional[Any]:
    if params:
        url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT,
                                               "Accept": "application/json",
                                               **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            raw = resp.read()
            if not raw:
                return None
            return json.loads(raw.decode("utf-8", "replace"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError,
            json.JSONDecodeError, ValueError, OSError):
        return None


def http_get_text(url: str, headers: dict | None = None) -> Optional[str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            return resp.read().decode("utf-8", "replace")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError):
        return None


_WORD = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> set[str]:
    return set(_WORD.findall((text or "").lower()))


def relevance(query: str, cand: Candidate) -> float:
    q = _tokens(query)
    if not q:
        return 1.0
    hay = _tokens(f"{cand.name} {cand.description} {cand.outputs}")
    if not hay:
        return 0.0
    return len(q & hay) / len(q)


def days_since(iso: str) -> Optional[int]:
    if not iso:
        return None
    s = iso.strip().replace("Z", "+00:00")
    for parse in (datetime.fromisoformat,):
        try:
            dt = parse(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return (datetime.now(timezone.utc) - dt).days
        except ValueError:
            pass
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        dt = datetime(int(m[1]), int(m[2]), int(m[3]), tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).days
    return None
