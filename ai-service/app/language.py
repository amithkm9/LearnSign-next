import json
import re

from .config import DATA_DIR
from .signs import find_sign_video

with open(DATA_DIR / "sign_translations.json", encoding="utf-8") as f:
    _DATA = json.load(f)

SUPPORTED_LANGUAGES: dict[str, str] = _DATA["SUPPORTED_LANGUAGES"]
SIGN_TRANSLATIONS: dict[str, dict[str, str]] = _DATA["SIGN_TRANSLATIONS"]
LANGUAGE_INSTRUCTIONS: dict[str, str] = _DATA["LANGUAGE_INSTRUCTIONS"]

_PUNCT = r"[।॥？।?!,.\-:;'\"()\[\]{}।॥…·•]+"
_PUNCT_WORD = r"[।॥？।?!,.\-:;'\"()\[\]{}…·•]+"


def detect_language(text: str) -> str:
    if not text:
        return "en"
    if re.search(r"[ऀ-ॿ]", text):
        return "hi"
    if re.search(r"[ಀ-೿]", text):
        return "kn"
    if re.search(r"[ఀ-౿]", text):
        return "te"
    return "en"


def translate_sentence_to_english_signs(sentence: str, language: str) -> str:
    if not sentence or not language or language == "en":
        return sentence
    translations = SIGN_TRANSLATIONS.get(language)
    if not translations:
        return sentence

    clean = re.sub(_PUNCT, "", sentence)
    clean = re.sub(r"\.{2,}", "", clean).strip()
    lower = clean.lower()

    if clean in translations:
        return translations[clean]
    if lower in translations:
        return translations[lower]

    nospace = re.sub(r"\s+", "", clean)
    if nospace in translations:
        return translations[nospace]
    if nospace.lower() in translations:
        return translations[nospace.lower()]

    words = clean.split()
    out: list[str] = []
    i = 0
    while i < len(words):
        if i + 2 < len(words):
            three = f"{words[i]} {words[i + 1]} {words[i + 2]}"
            if three in translations:
                out.append(translations[three])
                i += 3
                continue
        if i + 1 < len(words):
            two = f"{words[i]} {words[i + 1]}"
            if two in translations:
                out.append(translations[two])
                i += 2
                continue
        word = re.sub(_PUNCT_WORD, "", words[i]).strip()
        if not word:
            i += 1
            continue
        translated = translations.get(word) or translations.get(word.lower())
        if translated:
            out.append(translated)
        elif re.fullmatch(r"[A-Za-z]+", word):
            out.append(word.upper())
        i += 1

    return " ".join(out) or sentence


def extract_english_words_from_response(text: str, detected_language: str) -> list[dict]:
    if not text:
        return []
    priority = [
        "GOOD", "FINE", "HAPPY", "THANK", "WELCOME", "HELLO", "HI", "YES", "NO",
        "HELP", "PLEASE", "LOVE", "LEARN", "FRIEND", "FAMILY", "I", "YOU",
    ]
    secondary = [
        "SORRY", "PRACTICE", "WATCH", "VIDEO", "SIGN", "LANGUAGE", "MOTHER",
        "FATHER", "SCHOOL", "HOME", "EAT", "DRINK", "SLEEP", "PLAY", "READ",
        "WRITE", "UNDERSTAND", "MORNING", "EVENING", "TODAY", "TOMORROW",
        "TIME", "DAY", "NIGHT", "WATER", "FOOD", "GREAT", "AMAZING",
    ]
    found: list[dict] = []
    seen: set[str] = set()

    for word in re.findall(r"\b[A-Z]{2,}\b", text.upper()):
        if word in seen:
            continue
        video = find_sign_video(word)
        if video:
            seen.add(word)
            found.append({"word": word, "path": video["path"]})

    translations = SIGN_TRANSLATIONS.get(detected_language)
    if translations:
        for word in [*priority, *secondary]:
            if word in seen:
                continue
            video = find_sign_video(word)
            if video:
                for regional, english in translations.items():
                    if english == word and regional in text:
                        seen.add(word)
                        found.append({"word": word, "regionalWord": regional, "path": video["path"]})
                        break
            if len(found) >= 8:
                break
    return found
