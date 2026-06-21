import json
import re

from .config import DATA_DIR, has_openai
from .llm import get_openai_client, strip_code_fence
from .signs import all_signs, find_similar, find_sign_video
from .resolver import resolve_sign_item, llm_resolve_query, fingerspell
from .language import (
    LANGUAGE_INSTRUCTIONS,
    SUPPORTED_LANGUAGES,
    detect_language,
    extract_english_words_from_response,
    translate_sentence_to_english_signs,
)

PROMPT = (DATA_DIR / "tutor_prompt.txt").read_text(encoding="utf-8")


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
# Shown when a word has no single sign so we fingerspell it letter-by-letter.
FINGERSPELL_NOTE = {
    "en": lambda w: f"There's no single sign for {w}, so I'm fingerspelling it letter by letter.",
    "hi": lambda w: f"{w} के लिए एक साइन नहीं है, इसलिए मैं इसे अक्षर-दर-अक्षर दिखा रहा हूँ।",
    "kn": lambda w: f"{w} ಗೆ ಒಂದೇ ಸೈನ್ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಅಕ್ಷರ-ಅಕ್ಷರವಾಗಿ ತೋರಿಸುತ್ತಿದ್ದೇನೆ.",
    "te": lambda w: f"{w} కోసం ఒకే సైన్ లేదు, అందుకే అక్షరం అక్షరం చూపిస్తున్నాను.",
}
# Generic, always-correct teaching guidance shown with every demonstration.
TEACHING_TIPS = {
    "en": [
        "Get down to your child's eye level and make eye contact.",
        "Sign slowly first, then let them try — use the 0.5× and Mirror buttons.",
        "Repeat it a few times and celebrate every attempt! 🎉",
    ],
    "hi": [
        "बच्चे की आँखों के स्तर पर आएँ और नज़रें मिलाएँ।",
        "पहले धीरे-धीरे साइन करें, फिर उन्हें करने दें — 0.5× और मिरर बटन इस्तेमाल करें।",
        "कुछ बार दोहराएँ और हर कोशिश पर शाबाशी दें! 🎉",
    ],
    "kn": [
        "ಮಗುವಿನ ಕಣ್ಣಿನ ಮಟ್ಟಕ್ಕೆ ಬಂದು ಕಣ್ಣಲ್ಲಿ ಕಣ್ಣಿಟ್ಟು ನೋಡಿ.",
        "ಮೊದಲು ನಿಧಾನವಾಗಿ ಸೈನ್ ಮಾಡಿ, ನಂತರ ಅವರಿಗೆ ಮಾಡಲು ಬಿಡಿ — 0.5× ಮತ್ತು ಮಿರರ್ ಬಳಸಿ.",
        "ಕೆಲವು ಬಾರಿ ಪುನರಾವರ್ತಿಸಿ ಮತ್ತು ಪ್ರತಿ ಪ್ರಯತ್ನವನ್ನೂ ಹೊಗಳಿ! 🎉",
    ],
    "te": [
        "మీ పిల్లల కంటి స్థాయికి వచ్చి కళ్ళలో కళ్ళు పెట్టి చూడండి.",
        "ముందు నెమ్మదిగా సైన్ చేయండి, తర్వాత వారిని చేయనివ్వండి — 0.5×, మిర్రర్ వాడండి.",
        "కొన్ని సార్లు పునరావృతం చేసి ప్రతి ప్రయత్నాన్ని మెచ్చుకోండి! 🎉",
    ],
}
FINGERSPELL_TIP = {
    "en": "Fingerspelling is perfect for names — point to the thing as you spell it.",
    "hi": "नाम के लिए फिंगरस्पेलिंग सबसे अच्छी है — चीज़ की ओर इशारा करते हुए अक्षर दिखाएँ।",
    "kn": "ಹೆಸರುಗಳಿಗೆ ಫಿಂಗರ್‌ಸ್ಪೆಲ್ಲಿಂಗ್ ಸೂಕ್ತ — ವಸ್ತುವಿನತ್ತ ತೋರಿಸುತ್ತಾ ಅಕ್ಷರ ಹೇಳಿ.",
    "te": "పేర్లకు ఫింగర్‌స్పెల్లింగ్ చక్కగా పనిచేస్తుంది — వస్తువును చూపిస్తూ స్పెల్ చేయండి.",
}

# Filler words we won't bother fingerspelling inside a multi-word direct ask.
STOPWORDS = {
    "THE", "A", "AN", "TO", "OF", "AND", "OR", "MY", "YOUR", "IS", "ARE", "AM",
    "FOR", "IN", "ON", "AT", "IT", "BE", "DO", "DOES", "I", "SO", "IF", "AS",
}

_SIGN_REQUEST_PATTERNS = [
    r"how (do i |to |can i |would i |should i )?(sign|say|tell|show|teach|gesture|communicate|express)|show me|teach me|what('s| is) the sign|sign (for|of)|in sign|tell my (child|kid|son|daughter|baby)|how to (sign|say|tell)",
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


def translate_and_extract(response_text: str, language: str, original_query: str = "") -> list[dict]:
    if not response_text:
        return []
    # Only called for non-English responses (see process_message), so we go
    # straight to OpenAI concept extraction, with a keyword fallback.
    if not has_openai():
        return extract_english_words_from_response(response_text, language)
    try:
        available = all_signs()[:100]
        completion = get_openai_client().chat.completions.create(
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
        result = strip_code_fence((completion.choices[0].message.content or "").strip())
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

    # 1. Direct resolution of each word (exact -> alias -> synonym -> lemma),
    #    falling back to fingerspelling so every word yields a teachable step.
    tokens = [re.sub(r"[^A-Z0-9_]", "", w) for w in clean_message.split()]
    tokens = [t for t in tokens if t]

    def to_step(word: str, skip_stop: bool = False) -> dict | None:
        item = resolve_sign_item(word)
        if item:
            step = {"word": item["word"], "kind": "sign", "path": item["path"]}
            if "matchedFrom" in item:
                step["matchedFrom"] = item["matchedFrom"]
            return step
        if skip_stop and word.upper() in STOPWORDS:
            return None
        letters = fingerspell(word)
        if letters:
            return {"word": word.upper(), "kind": "fingerspell", "letters": letters}
        return None

    def build_steps(words: list[str], skip_stop: bool = False) -> list[dict]:
        return [s for w in words if (s := to_step(w, skip_stop))]

    steps = build_steps(tokens, skip_stop=len(tokens) > 1)
    has_sign = any(s["kind"] == "sign" for s in steps)

    # 2. For conversational asks (or when nothing resolved to a real sign), let
    #    the grounded LLM extract the intended words instead of the token soup.
    use_llm = has_openai() and is_sign_request and (len(tokens) > 4 or not has_sign)
    if use_llm:
        llm_tokens = llm_resolve_query(message, valid)
        if llm_tokens:
            words = [
                t.split(":", 1)[1] if t.upper().startswith("FINGERSPELL:") else t
                for t in llm_tokens
            ]
            llm_steps = build_steps([w.strip() for w in words])
            if llm_steps:
                steps = llm_steps

    if steps and is_sign_request:
        fingerspelled = [s["word"] for s in steps if s["kind"] == "fingerspell"]
        found_words = " ".join(s["word"] for s in steps)
        response = {
            "type": "sign_sequence",
            "isSentence": len(steps) > 1,
            "sentence": found_words,
            "originalQuery": message,
            "response": HEADER.get(valid, HEADER["en"])(found_words),
            "videoSequence": steps,
            "fingerspelledWords": fingerspelled,
            "notFoundWords": [],  # nothing is "not found" anymore — we fingerspell it
            "totalVideos": len(steps),
            "language": valid,
        }
        tips = list(TEACHING_TIPS.get(valid, TEACHING_TIPS["en"]))
        if fingerspelled:
            tips.append(FINGERSPELL_TIP.get(valid, FINGERSPELL_TIP["en"]))
        response["teachingTips"] = tips
        if fingerspelled:
            response["warning"] = FINGERSPELL_NOTE.get(valid, FINGERSPELL_NOTE["en"])(
                ", ".join(fingerspelled)
            )
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

        completion = get_openai_client().chat.completions.create(
            model="gpt-4o-mini", messages=messages, max_tokens=800, temperature=0.7
        )
        raw = strip_code_fence((completion.choices[0].message.content or "").strip())
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
