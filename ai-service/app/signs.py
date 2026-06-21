import json
import re

from .config import DATA_DIR

with open(DATA_DIR / "signs_manifest.json", encoding="utf-8") as f:
    _MANIFEST: dict[str, str] = json.load(f)  # {UPPERNAME: "/assets/videos/signs/file.webm"}


def find_sign_video(word: str) -> dict | None:
    """Return {'word', 'path'} for a sign, or None (ported from TS findSignVideo)."""
    if not word:
        return None
    normalized = word.upper().strip()
    if normalized in _MANIFEST:
        return {"word": normalized, "path": _MANIFEST[normalized]}
    clean = re.sub(r"[^A-Z0-9]", "", normalized)
    if clean in _MANIFEST:
        return {"word": clean, "path": _MANIFEST[clean]}
    return None


def all_signs() -> list[str]:
    return list(_MANIFEST.keys())


def find_similar(word: str) -> list[str]:
    signs = all_signs()
    normalized = word.upper()
    starts = [s for s in signs if s.startswith(normalized[:2])][:5]
    contains = [s for s in signs if normalized in s][:5]
    seen: dict[str, None] = {}
    for s in [*starts, *contains]:
        seen.setdefault(s, None)
    return list(seen.keys())[:5]
