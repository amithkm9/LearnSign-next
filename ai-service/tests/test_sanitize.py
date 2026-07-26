"""Model output must never hand the browser a video URL we didn't choose.

The tutor's general-help branch returns the model's JSON verbatim, and the
client feeds `path` straight into a <video src>. `mediaUrl` passes absolute
URLs through untouched, so an injected "https://attacker/..." would be fetched
by the user's browser.
"""

import os

os.environ.setdefault("ALLOW_INSECURE_LOCAL", "1")

import pytest

from app.signs import _MANIFEST, is_known_path
from app.tutor import sanitize_llm_response

GOOD = next(iter(_MANIFEST.values()))


@pytest.mark.parametrize(
    "path",
    [
        "https://attacker.example/evil.webm",
        "//attacker.example/evil.webm",
        "javascript:alert(1)",
        "/assets/videos/signs/does-not-exist.webm",
        "../../etc/passwd",
        "",
        None,
        42,
        {"nested": "object"},
    ],
)
def test_rejects_paths_not_in_the_manifest(path):
    assert is_known_path(path) is False


def test_accepts_manifest_paths():
    assert is_known_path(GOOD) is True


def test_drops_injected_steps_but_keeps_real_ones():
    result = sanitize_llm_response(
        {
            "type": "general_help",
            "response": "hello",
            "videoSequence": [
                {"word": "EVIL", "path": "https://attacker.example/x.webm"},
                {"word": "OK", "path": GOOD},
            ],
        }
    )
    assert result["videoSequence"] == [{"word": "OK", "path": GOOD}]
    assert result["response"] == "hello"


def test_drops_the_key_entirely_when_nothing_survives():
    result = sanitize_llm_response(
        {
            "responseSigns": [{"word": "EVIL", "path": "javascript:alert(1)"}],
            "hasResponseSigns": True,
        }
    )
    assert "responseSigns" not in result
    # The flag must go too, or the client renders an empty player.
    assert "hasResponseSigns" not in result


def test_filters_individual_fingerspell_letters():
    result = sanitize_llm_response(
        {
            "videoSequence": [
                {
                    "word": "RIYA",
                    "kind": "fingerspell",
                    "letters": [
                        {"char": "R", "path": "https://attacker.example/r.webm"},
                        {"char": "I", "path": GOOD},
                    ],
                }
            ]
        }
    )
    assert result["videoSequence"][0]["letters"] == [{"char": "I", "path": GOOD}]


def test_handles_malformed_shapes_without_raising():
    assert sanitize_llm_response({"videoSequence": "not-a-list"}) == {}
    assert sanitize_llm_response({"videoSequence": [None, 1, "x"]}) == {}
    assert sanitize_llm_response({}) == {}
