import json

from .config import has_openai
from .tutor import client, _strip_code_fence


def _fallback(payload: dict) -> dict:
    stats = payload.get("statistics", {})
    name = payload.get("student", {}).get("name", "your child")
    completed = stats.get("totalCompleted", 0)
    return {
        "overallSummary": (
            f"{name} has completed {completed} course(s) with a "
            f"{stats.get('completionPct', 0)}% completion rate and a "
            f"{stats.get('currentStreak', 0)}-day streak. A steady start!"
        ),
        "strengthsAnalysis": "Consistent practice is building a strong foundation.",
        "areasForGrowth": "A short daily session would help build a longer learning streak.",
        "achievements": [],
        "parentTips": [
            "Practice a few signs together for 10 minutes a day.",
            "Celebrate small wins to keep motivation high.",
        ],
        "weeklyGoal": "Complete one lesson and one quiz this week.",
        "encouragement": "Every sign learned is a new way to connect — you're doing wonderfully!",
    }


def generate_insights(payload: dict) -> dict:
    """AI-generated parent-report narrative from the stats Next gathered."""
    if not has_openai():
        return _fallback(payload)
    try:
        completion = client().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert sign-language learning advisor writing a warm, "
                        "encouraging report for a PARENT about their child's progress. Be "
                        "specific, positive, and actionable; reference the real numbers.\n"
                        'Return ONLY JSON: {"overallSummary": str, "strengthsAnalysis": str, '
                        '"areasForGrowth": str, "achievements": [str], "parentTips": [str], '
                        '"weeklyGoal": str, "encouragement": str}'
                    ),
                },
                {
                    "role": "user",
                    "content": "Student report data:\n" + json.dumps(payload, ensure_ascii=False),
                },
            ],
            max_tokens=900,
            temperature=0.7,
        )
        raw = _strip_code_fence((completion.choices[0].message.content or "").strip())
        data = json.loads(raw)
        result = _fallback(payload)
        result.update({k: v for k, v in data.items() if v})
        return result
    except Exception:
        return _fallback(payload)
