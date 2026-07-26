"""The internal token must fail CLOSED.

This service is deployed to a public host, so a missing token used to mean
"serve the OpenAI-backed endpoints to the whole internet" — silently.
"""

import importlib
import os
import sys

import pytest


def _reload_config(monkeypatch, **env):
    for key in ("INTERNAL_API_TOKEN", "ALLOW_INSECURE_LOCAL"):
        monkeypatch.delenv(key, raising=False)
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    # config calls load_dotenv(); stop the on-disk .env from leaking in.
    monkeypatch.setattr("dotenv.load_dotenv", lambda *a, **k: False)
    sys.modules.pop("app.config", None)
    return importlib.import_module("app.config")


def test_refuses_to_boot_without_a_token(monkeypatch):
    with pytest.raises(RuntimeError, match="INTERNAL_API_TOKEN"):
        _reload_config(monkeypatch)


def test_boots_with_a_token(monkeypatch):
    config = _reload_config(monkeypatch, INTERNAL_API_TOKEN="s3cret")
    assert config.INTERNAL_API_TOKEN == "s3cret"


def test_local_opt_out_is_explicit(monkeypatch):
    config = _reload_config(monkeypatch, ALLOW_INSECURE_LOCAL="1")
    assert config.INTERNAL_API_TOKEN is None


def test_cors_is_off_by_default(monkeypatch):
    config = _reload_config(monkeypatch, INTERNAL_API_TOKEN="s3cret")
    assert config.CORS_ALLOW_ORIGINS == []


def test_cors_origins_are_parsed_from_a_list(monkeypatch):
    monkeypatch.setenv("CORS_ALLOW_ORIGINS", "https://a.example, https://b.example")
    config = _reload_config(monkeypatch, INTERNAL_API_TOKEN="s3cret")
    assert config.CORS_ALLOW_ORIGINS == ["https://a.example", "https://b.example"]


class TestTokenCheck:
    """`require_internal_token` rejects everything but an exact match."""

    @staticmethod
    def _dependency(monkeypatch, token):
        _reload_config(monkeypatch, INTERNAL_API_TOKEN=token)
        sys.modules.pop("app.main", None)
        os.environ["ALLOW_INSECURE_LOCAL"] = "1"  # keep re-imports of config happy
        main = importlib.import_module("app.main")
        return main.require_internal_token

    def test_accepts_the_right_token(self, monkeypatch):
        check = self._dependency(monkeypatch, "s3cret")
        assert check("s3cret") is None

    @pytest.mark.parametrize("supplied", [None, "", "wrong", "s3cre", "s3cret "])
    def test_rejects_everything_else(self, monkeypatch, supplied):
        from fastapi import HTTPException

        check = self._dependency(monkeypatch, "s3cret")
        with pytest.raises(HTTPException) as exc:
            check(supplied)
        assert exc.value.status_code == 401
