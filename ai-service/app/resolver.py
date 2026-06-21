"""
Turns whatever a parent types into the right sign(s).

Resolution order for a single word: exact key -> structural alias
(PLAY_0A, "EVENING (1)", NO-ONE) -> curated synonym -> light lemma. When direct
resolution fails on a conversational ask ("how do I sign thank you to my kid"),
`llm_resolve_query` extracts the intended sign words, grounded in the real
library so it can never invent a sign that has no video.
"""
import json
import re

from .config import DATA_DIR, has_openai
from .llm import get_openai_client, strip_code_fence
from .signs import _MANIFEST, all_signs

# ---- curated human synonyms (lowercase phrase -> manifest key) ----
with open(DATA_DIR / "sign_synonyms.json", encoding="utf-8") as f:
    _raw_syn = json.load(f)
SYNONYMS: dict[str, str] = {
    k.lower().strip(): v
    for k, v in _raw_syn.items()
    if not k.startswith("_") and v in _MANIFEST  # drop any stale target
}

# ---- optional per-sign teaching breakdowns (key -> plain-language how-to) ----
with open(DATA_DIR / "sign_breakdowns.json", encoding="utf-8") as f:
    BREAKDOWNS: dict[str, str] = {
        k: v for k, v in json.load(f).items() if not k.startswith("_")
    }


def _alnum(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", s.upper())


def _base_forms(key: str) -> set[str]:
    """Normalized lookup forms for a manifest key (handles its quirky suffixes)."""
    u = key.upper()
    forms = {
        u,
        _alnum(u),                          # PLAY0A, NOONE
        re.sub(r"\s*\(\d+\)$", "", u).strip(),  # "EVENING (1)" -> EVENING
        u.split("_")[0],                    # PLAY_0A -> PLAY, GIVE_0A -> GIVE
        re.sub(r"[-_]", " ", u),            # NO-ONE -> "NO ONE"
        _alnum(u.split("_")[0]),            # PLAY
    }
    return {f for f in forms if f}


# Auto-built alias index: normalized form -> real key. Exact keys win over
# derived bases (e.g. a real "PLAY" would beat PLAY_0A's derived "PLAY").
ALIAS: dict[str, str] = {}
for _key in _MANIFEST:
    ALIAS.setdefault(_key.upper(), _key)
    ALIAS.setdefault(_alnum(_key), _key)
for _key in _MANIFEST:
    for _form in _base_forms(_key):
        ALIAS.setdefault(_form, _key)


def _lemmas(word: str) -> list[str]:
    """Cheap English de-inflection (no NLP dep): eating->EAT, dogs->DOG."""
    out = [word]
    for suf in ("ING", "ED", "ES", "S", "ER"):
        if word.endswith(suf) and len(word) - len(suf) >= 2:
            out.append(word[: -len(suf)])
    if word.endswith("IES") and len(word) > 4:  # puppies -> PUPPY
        out.append(word[:-3] + "Y")
    return out


def resolve_word(word: str) -> str | None:
    """Map one user word to a manifest key, or None."""
    if not word:
        return None
    syn = SYNONYMS.get(word.lower().strip())
    if syn:
        return syn
    n = word.upper().strip()
    for cand in (n, _alnum(n), re.sub(r"[-_]", " ", n)):
        if cand in _MANIFEST:
            return cand
        if cand in ALIAS:
            return ALIAS[cand]
    for lem in _lemmas(_alnum(n)):
        if lem in _MANIFEST:
            return lem
        if lem in ALIAS:
            return ALIAS[lem]
    return None


def fingerspell(word: str) -> list[dict]:
    """Letter-by-letter clips for a word, from the A-Z/0-9 sign videos.

    Returns [{char, path}, ...]; skips characters with no clip (spaces, punctuation).
    """
    out = []
    for ch in word.upper():
        if ch in _MANIFEST:  # only single letters/digits exist as 1-char keys
            out.append({"char": ch, "path": _MANIFEST[ch]})
    return out


def resolve_sign_item(word: str) -> dict | None:
    """A sign step ({word, kind:'sign', path}) for a resolvable word, else None."""
    key = resolve_word(word)
    if not key:
        return None
    item = {"word": key, "kind": "sign", "path": _MANIFEST[key]}
    if key.upper() != word.upper():
        item["matchedFrom"] = word
    if key in BREAKDOWNS:
        item["breakdown"] = BREAKDOWNS[key]
    return item


def llm_resolve_query(message: str, language: str = "en") -> list[str] | None:
    """
    Grounded extraction for conversational asks. Returns an ordered list of
    tokens, each either a manifest KEY (a sign exists) or "FINGERSPELL:<word>"
    (a proper noun / no sign). None if OpenAI is unavailable or it fails.
    """
    if not has_openai():
        return None
    try:
        available = all_signs()
        completion = get_openai_client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "A parent wants to learn which Indian Sign Language sign(s) to show "
                        "their child. From their message, extract ONLY the word(s) they want "
                        "to sign, in order. Map each to the closest item in AVAILABLE_SIGNS. "
                        "If a wanted word is a name/proper-noun or has no close match, output "
                        '"FINGERSPELL:<word>" for it. Ignore pleasantries and filler.\n'
                        f"AVAILABLE_SIGNS: {', '.join(available)}\n"
                        'Return JSON only: {"tokens": ["MOTHER", "FINGERSPELL:Riya"]}'
                    ),
                },
                {"role": "user", "content": f'Message ({language}): "{message}"'},
            ],
            max_tokens=150,
            temperature=0.2,
        )
        raw = strip_code_fence((completion.choices[0].message.content or "").strip())
        tokens = json.loads(raw).get("tokens", [])
        return [t for t in tokens if isinstance(t, str) and t.strip()]
    except Exception:
        return None
