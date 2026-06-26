"""Tier-2 deep static vet: shallow-clone into a sandbox, scan files, compute Risk Band.

SAFETY: this NEVER executes the cloned code. It only `git clone --depth 1` (no build/install
hooks run) and reads files. The clone lands in a temp dir and is removed after scanning.
"""
from __future__ import annotations

import os
import re
import subprocess
import tempfile
from pathlib import Path

from . import patterns
from .common import normalize_repo

MAX_FILE_BYTES = 1_000_000
MAX_FILES = 600


def _git(args: list[str], cwd: str | None = None, timeout: int = 90) -> tuple[int, str]:
    try:
        r = subprocess.run(["git", *args], cwd=cwd, capture_output=True,
                           text=True, timeout=timeout)
        return r.returncode, (r.stdout or r.stderr)
    except (subprocess.SubprocessError, OSError) as e:
        return 1, str(e)


def _clone(repo_url: str, ref: str | None, dest: str) -> tuple[bool, str]:
    """Shallow clone WITHOUT running any repo hooks. Returns (ok, sha)."""
    # -c core.hooksPath=/dev/null neutralizes any committed git hooks during clone.
    args = ["-c", "core.hooksPath=/dev/null", "clone", "--depth", "1", "--quiet"]
    if ref:
        args += ["--branch", ref]
    args += [repo_url, dest]
    code, _ = _git(args)
    if code != 0:
        return False, ""
    code, sha = _git(["rev-parse", "HEAD"], cwd=dest)
    return True, (sha.strip() if code == 0 else "")


def _green_flags(root: Path) -> list[str]:
    flags = []
    names = {p.name.lower() for p in root.rglob("*") if p.is_file()}
    if any(n.startswith("license") for n in names):
        flags.append("רישיון קיים")
    if any(n in ("readme.md", "readme") for n in names):
        flags.append("README קיים")
    if any("test" in n for n in names):
        flags.append("בדיקות (tests)")
    # allowed-tools declared + minimal?
    skill = next((p for p in root.rglob("SKILL.md")), None)
    if skill:
        try:
            txt = skill.read_text("utf-8", "replace")
            m = re.search(r"allowed-tools\s*:\s*(.+)", txt, re.I)
            if m:
                flags.append(f"allowed-tools מוגדר ({m.group(1).strip()[:50]})")
        except OSError:
            pass
    return flags


def _band(findings: list[dict]) -> tuple[int, str]:
    crit_cats = {f["category"] for f in findings if f["severity"] == patterns.CRITICAL}
    has_high = any(f["severity"] == patterns.HIGH for f in findings)
    has_med = any(f["severity"] == patterns.MED for f in findings)
    if len(crit_cats) >= 2:
        return 5, "אל תתקין"
    if crit_cats:
        return 4, "סיכון גבוה"
    if has_high:
        return 3, "סיכון בינוני - לבדוק ידנית"
    if has_med:
        return 2, "סיכון נמוך"
    return 1, "נראה בטוח"


def vet_repo(repo_url: str, ref: str | None = None) -> dict:
    """Clone (sandboxed) + scan. Returns a verdict dict (never raises)."""
    result = {
        "repo": repo_url, "repo_slug": normalize_repo(repo_url), "ref": ref,
        "sha": "", "ok": False, "band": None, "band_label": "",
        "files_scanned": 0, "findings": [], "green_flags": [], "error": "",
    }
    if not repo_url:
        result["error"] = "no repo url"
        return result

    tmp = tempfile.mkdtemp(prefix="skillscout-")
    dest = os.path.join(tmp, "src")
    try:
        ok, sha = _clone(repo_url, ref, dest)
        if not ok:
            result["error"] = "clone failed (private/不存在/network?)"
            return result
        result["sha"] = sha
        root = Path(dest)

        findings, n = [], 0
        for p in root.rglob("*"):
            if n >= MAX_FILES:
                break
            if not p.is_file() or ".git/" in str(p):
                continue
            if not patterns.should_scan(p.name):
                continue
            try:
                if p.stat().st_size > MAX_FILE_BYTES:
                    continue
                text = p.read_text("utf-8", "replace")
            except OSError:
                continue
            rel = str(p.relative_to(root))
            findings.extend({**f, "file": rel} for f in patterns.scan_text(text, rel))
            n += 1

        # de-dup identical (file,line,rule)
        seen, uniq = set(), []
        for f in findings:
            k = (f["file"], f["line"], f["rule"])
            if k not in seen:
                seen.add(k); uniq.append(f)

        band, label = _band(uniq)
        result.update(ok=True, files_scanned=n, findings=uniq,
                      green_flags=_green_flags(root), band=band, band_label=label)
        return result
    finally:
        subprocess.run(["rm", "-rf", tmp], capture_output=True)


def severity_counts(findings: list[dict]) -> dict:
    out = {patterns.CRITICAL: 0, patterns.HIGH: 0, patterns.MED: 0, patterns.LOW: 0}
    for f in findings:
        out[f["severity"]] = out.get(f["severity"], 0) + 1
    return out
