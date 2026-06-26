"""Tier-1 Reputation Confidence (0-100). Mirrors references/scoring-rubric.md.

This is reputation, NOT a code audit. Anything to be installed must still pass Tier-2 (vet).
"""
from __future__ import annotations

import math

from .common import Candidate, days_since

TRUSTED_OWNERS = {"anthropics", "modelcontextprotocol", "anthropic-ai", "composiohq"}
SCANNING_SOURCES = {"skills.sh", "skillsdirectory"}


def score_candidate(c: Candidate) -> Candidate:
    pts, reasons = 0.0, []

    # Popularity (max 30)
    pop = min(30.0, 12.0 * math.log10(1 + c.stars + c.installs))
    pts += pop
    if c.stars or c.installs:
        reasons.append(f"פופולריות {int(pop)}/30 ({c.stars}★)")

    # Provenance (max 25)
    owner = (c.publisher or "").lower()
    if c.official or owner in TRUSTED_OWNERS:
        pts += 25; reasons.append("מקור רשמי/מהימן")
    elif c.verified:
        pts += 18; reasons.append("מסומן verified")
    elif owner:
        pts += 6
    # known scanning-source verification
    if c.verified and c.source in SCANNING_SOURCES:
        pts += 15; reasons.append("עבר סריקה במקור בודק")

    # Freshness (max 20)
    if c.archived:
        reasons.append("ארכיון (לא מתוחזק)")
    else:
        d = days_since(c.last_updated)
        if d is None:
            pass
        elif d <= 90:
            pts += 20; reasons.append("עודכן לאחרונה")
        elif d <= 180:
            pts += 14
        elif d <= 365:
            pts += 8
        else:
            reasons.append("לא עודכן מעל שנה")

    # Maintenance (max 10)
    if c.license:
        pts += 5; reasons.append(f"רישיון {c.license}")
    if not c.archived and (days_since(c.last_updated) or 999) <= 180:
        pts += 5

    # Safety prior-art (max 15)
    if c.requires_code_execution is False:
        pts += 8; reasons.append("לא דורש הרצת קוד")
    elif c.requires_code_execution is True:
        pts -= 5; reasons.append("דורש הרצת קוד")

    c.score = max(0, min(100, round(pts)))
    c.score_reason = " · ".join(reasons[:4]) if reasons else "מעט סיגנלים זמינים"
    return c


def band_label(score: int) -> str:
    if score >= 80:
        return "מצוין"
    if score >= 60:
        return "טוב"
    if score >= 40:
        return "בינוני"
    return "חלש/לא ידוע"
