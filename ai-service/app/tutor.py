import json
import re

from .config import DATA_DIR, OPENAI_API_KEY, has_openai
from .signs import all_signs, find_similar, find_sign_video
from .language import (
    LANGUAGE_INSTRUCTIONS,
    SUPPORTED_LANGUAGES,
    detect_language,
    extract_english_words_from_response,
    translate_sentence_to_english_signs,
)

PROMPT = (DATA_DIR / "tutor_prompt.txt").read_text(encoding="utf-8")

_client = None


def client():
    global _client
    if _client is None and has_openai():
        from openai import OpenAI

        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


HEADER = {
    "en": lambda w: f'Here\'s how to sign "{w}" 👇',
    "hi": lambda w: f'यहाँ "{w}" का साइन है 👇',
    "kn": lambda w: f'ಇಲ್ಲಿ "{w}" ಸೈನ್ ಇದೆ 👇',
    "te": lambda w: f'ఇక్కడ "{w}" సైన్ ఉంది 👇',
}
SPEECH = {
    "en": lambda w: f"Here's how to sign {w}. Watch the video to learn!",
    "hi": lambda w: f"यहाँ {w} का साइन है। सीखने के लिए वीडियो देखें!",
    "kn": lambda w: f"ಇಲ್ಲಿ {w} ಸೈನ್ ಇದೆ. ಕಲಿಯಲು ವೀಡಿಯೋ ನೋಡಿ!",
    "te": lambda w: f"ఇక్కడ {w} సైన్ ఉంది. నేర్చుకోవడానికి వీడియో చూడండి!",
}
WARN = {
    "en": lambda w: f"Note: No video for: {w}",
    "hi": lambda w: f"नोट: इनके लिए वीडियो नहीं है: {w}",
    "kn": lambda w: f"ಗಮನಿಸಿ: ಇವುಗಳಿಗೆ ವೀಡಿಯೋ ಇಲ್ಲ: {w}",
    "te": lambda w: f"గమనిక: వీటికి వీడియో లేదు: {w}",
}

_SIGN_REQUEST_PATTERNS = [
    r"how (do i |to |can i )?sign|show me|teach me|what('s| is) the sign",
    r"का साइन|साइन दिखाओ|कैसे करें|सिखाओ|कैसे हो|क्या हाल|नमस्ते|धन्यवाद",
    r"ಸೈನ್|ತೋರಿಸಿ|ಕಲಿಸಿ|ಹೇಗೆ|ಹೇಗಿದ್ದೀ|ನಮಸ್ಕಾರ|ಧನ್ಯವಾದ|ಚೆನ್ನಾಗಿ|ಏನು|ಯಾರು",
    r"సైన్|చూపించు|నేర్పించు|ఎలా|నమస్కారం|ధన్యవాదాలు|బాగున్నారా|ఏమిటి",
]


def populate_prompt(profile: dict) -> str:
    rep = {
        "{{userName}}": profile.get("userName", "Learner"),
        "{{ageGroup}}": profile.get("ageGroup", "15+"),
        "{{accountAge}}": profile.get("accountAge", 0),
        "{{totalCourses}}": profile.get("totalCourses", 0),
        "{{coursesCompleted}}": profile.get("coursesCompleted", 0),
        "{{progressPercentage}}": profile.get("progressPercentage", 0),
        "{{totalMinutes}}": profile.get("totalMinutes", 0),
        "{{recentQuizScores}}": profile.get("recentQuizScores", ""),
        "{{avgQuizScore}}": profile.get("avgQuizScore", 0),
        "{{currentStreak}}": profile.get("currentStreak", 0),
        "{{lastActive}}": profile.get("lastActive", "Never"),
        "{{weakAreas}}": profile.get("weakAreas", ""),
        "{{strongAreas}}": profile.get("strongAreas", ""),
        "{{language}}": profile.get("language", "en"),
        "{{learningStyle}}": profile.get("learningStyle", ""),
    }
    prompt = PROMPT
    for key, value in rep.items():
        prompt = prompt.replace(key, str(value))
    return prompt


def _strip_code_fence(text: str) -> str:
    if text.startswith("```"):
        text = re.sub(r"^```[a-z]*\n?", "", text, flags=re.I)
        text = re.sub(r"\n?```$", "", text).strip()
    return text


def translate_and_extract(response_text: str, language: str, original_query: str = "") -> list[dict]:
    if not response_text:
        return []
    # Only called for non-English responses (see process_message), so we go
    # straight to OpenAI concept extraction, with a keyword fallback.
    if not has_openai():
        return extract_english_words_from_response(response_text, language)
    try:
        available = all_signs()[:100]
        completion = client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a sign language expert. Identify KEY CONCEPTS from a regional "
                        "Indian language response to demonstrate as sign videos. Translate main "
                        "concepts to English; only meaningful words; ignore fillers.\n"
                        f"Available sign videos: {', '.join(available)}\n"
                        'Return JSON: {"translatedConcepts": ["HELLO", "THANK"]}'
                    ),
                },
                {
                    "role": "user",
                    "content": f'Original question: "{original_query}"\nResponse ({language}): "{response_text}"\nExtract key concepts.',
                },
            ],
            max_tokens=200,
            temperature=0.3,
        )
        result = _strip_code_fence((completion.choices[0].message.content or "").strip())
        concepts = json.loads(result).get("translatedConcepts", [])
        found, seen = [], set()
        for concept in concepts:
            clean = re.sub(r"[^A-Z0-9_]", "", concept.upper())
            if len(clean) < 2 or clean in seen:
                continue
            video = find_sign_video(clean)
            if video:
                seen.add(clean)
                found.append({"word": clean, "path": video["path"]})
        return found
    except Exception:
        return extract_english_words_from_response(response_text, language)


def process_message(message: str, language: str = "en", history=None, profile=None) -> dict:
    """Core tutor handler. Returns {response, language, text_for_speech}."""
    history = history or []
    detected = detect_language(message)
    valid = (
        language
        if language in SUPPORTED_LANGUAGES
        else (detected if detected in SUPPORTED_LANGUAGES else "en")
    )
    translation_lang = detected if detected != "en" else valid
    clean_message = translate_sentence_to_english_signs(message, translation_lang).upper()

    translation_successful = clean_message != message.upper() and len(clean_message) > 0
    is_short = len(clean_message.split()) <= 6
    is_sign_request = is_short or translation_successful or any(
        re.search(p, message, re.I) for p in _SIGN_REQUEST_PATTERNS
    )

    video_sequence, not_found = [], []
    for word in clean_message.split():
        clean = re.sub(r"[^A-Z0-9_]", "", word)
        if not clean:
            continue
        video = find_sign_video(clean)
        if video:
            video_sequence.append({"word": clean, "path": video["path"]})
        else:
            not_found.append(clean)

    if video_sequence and is_sign_request:
        found_words = " ".join(v["word"] for v in video_sequence)
        response = {
            "type": "sign_sequence",
            "isSentence": len(video_sequence) > 1,
            "sentence": found_words,
            "originalQuery": message,
            "response": HEADER.get(valid, HEADER["en"])(found_words),
            "videoSequence": video_sequence,
            "notFoundWords": not_found,
            "totalVideos": len(video_sequence),
            "language": valid,
        }
        if not_found:
            response["warning"] = WARN.get(valid, WARN["en"])(", ".join(not_found))
        return {
            "response": response,
            "language": valid,
            "text_for_speech": SPEECH.get(valid, SPEECH["en"])(found_words),
        }

    def fallback() -> dict:
        first = (clean_message.split() or ["HELLO"])[0]
        text = 'I can show you sign videos! Try asking for a word like "hello", "thank you", or "family".'
        return {
            "response": {
                "type": "not_found",
                "response": text,
                "suggestions": find_similar(first),
                "language": valid,
            },
            "language": valid,
            "text_for_speech": text,
        }

    if not has_openai():
        return fallback()

    try:
        system_prompt = populate_prompt(profile) if profile else PROMPT
        system_prompt += f"\n\n🌐 LANGUAGE: {LANGUAGE_INSTRUCTIONS.get(valid, LANGUAGE_INSTRUCTIONS['en'])}"
        system_prompt += (
            "\n\nNaturally include words that have sign videos: GOOD, FINE, HAPPY, THANK, "
            "HELLO, YES, NO, HELP, PLEASE, LOVE, LEARN, FRIEND, FAMILY."
        )
        available = all_signs()[:50]
        messages = [
            {"role": "system", "content": f"{system_prompt}\n\nAvailable sign videos: {', '.join(available)}..."}
        ]
        for m in history[-6:]:
            content = m["content"] if isinstance(m["content"], str) else json.dumps(m["content"])
            messages.append({"role": m["role"], "content": content})
        messages.append({"role": "user", "content": message})

        completion = client().chat.completions.create(
            model="gpt-4o-mini", messages=messages, max_tokens=800, temperature=0.7
        )
        raw = _strip_code_fence((completion.choices[0].message.content or "").strip())
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"type": "general_help", "response": raw}
        parsed["language"] = valid

        if valid != "en":
            signs = translate_and_extract(parsed.get("response") or raw, valid, message)
            if signs:
                parsed["hasResponseSigns"] = True
                parsed["responseSigns"] = signs

        return {"response": parsed, "language": valid, "text_for_speech": parsed.get("response") or raw}
    except Exception:
        return fallback()
