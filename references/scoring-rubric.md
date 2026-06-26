# Scoring Rubric

> Two numbers, two purposes. Both are decision-support, never a guarantee.
> `score.py` computes Tier-1; `vet.py` computes Tier-2.

## Tier-1 - Reputation Confidence (0-100), no clone

The number shown in the **discovery shortlist**. "How much do the public signals say I can
trust this?" Higher = more trustworthy. It is reputation, NOT a code audit - the shortlist row
must say so.

| Component | Max pts | How |
|-----------|--------:|-----|
| Popularity | 30 | `min(30, 12*log10(1 + stars + installs))`. 10★~=12, 100★~=24, 1k★~=30. |
| Provenance | 25 | official/Anthropic +25; verified badge +18; known publisher w/ history +12; anonymous/new +0. |
| Freshness | 20 | commit in <=90d +20; <=180d +14; <=365d +8; older/archived +0. |
| Maintenance | 10 | license present +5; releases/tests/CI +5. |
| Safety prior-art | 15 | existing-scanner pass (skills.sh audit / skillsdirectory verified) +15; `requires_code_execution=false` +8; `requires_code_execution=true` -5; flagged by a scanner -15. |

Sum, clamp to 0-100. Banding for the shortlist label:
- **80-100** מצוין - מקור אמין, פופולרי, מתוחזק
- **60-79** טוב - שווה בדיקה מעמיקה
- **40-59** בינוני - תלוי בבדיקת הקוד
- **0-39** חלש/לא ידוע - היזהר

> Tier-1 never says "safe". Anything you actually want to install must pass Tier-2.

## Tier-2 - Static Safety Risk Band (1-5), after clone

The number in the **final verdict**. Driven by what the scanner actually found in the code.

| Band | Label (Hebrew) | Trigger |
|:----:|----------------|---------|
| 1 | נראה בטוח | no findings above LOW; green flags present |
| 2 | סיכון נמוך | only MED findings, all explained by the stated purpose |
| 3 | סיכון בינוני - לבדוק ידנית | HIGH findings, or MED without clear justification |
| 4 | סיכון גבוה | a CRITICAL finding, or multiple HIGH |
| 5 | אל תתקין | multiple CRITICAL, active exfil/obfuscation, or proven malicious pattern |

Computation (`vet.py`):
- Start at band 1.
- Any CRITICAL category hit -> band >= 4 (>= 5 if two or more CRITICAL categories).
- Any HIGH category hit -> band >= 3.
- Only MED -> band 2.
- Green-flag bonus can lower a band-2/3 by one **only** if no CRITICAL/HIGH and the flag is the
  benign-but-noisy kind (e.g. a documented `.env.example`). Never lowers a CRITICAL.

## Final verdict = Tier-2 band + a confidence note

Some users prefer "the risk looks like 1/2/3". We answer with the **band (1-5)** plus a plain label
and a **confidence note** that separates what we scanned from what we inferred:

- "**זה בדקתי בקוד**" - the scan findings (facts).
- "**זה סיגנל מוניטין**" - stars/freshness/publisher (inference about trust, not the code).
- Always the caveat (see verdict-template.md). The band is our read of the evidence, not a promise.

## Mapping to a 1/2/3 shorthand (optional display)

If a 1-3 phrasing is wanted in chat, collapse: band 1-2 -> "סיכון 1 (נמוך)", band 3 -> "סיכון 2
(בינוני)", band 4-5 -> "סיכון 3 (גבוה - לא מומלץ)". Keep the underlying 1-5 in the registry.
