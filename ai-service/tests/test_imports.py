"""Every module must import cleanly.

The formatter's autofix removes imports it believes are unused, which it gets
wrong when an edit adds the import and its first use in separate steps. That
stripped `logging`/`secrets` from app.main and `threading` from app.recognition;
both only surfaced at runtime, and app.recognition's failure was swallowed by
the /recognize catch-all and shown to the user as "I can't see your hands".

A plain import is enough to catch it: the breakage is at module scope.
"""

import importlib
import os
import pkgutil

os.environ.setdefault("ALLOW_INSECURE_LOCAL", "1")

import pytest

import app

# Heavy ML deps (tensorflow, mediapipe, cv2) are imported lazily inside
# functions, so importing the module itself stays cheap.
MODULES = sorted(m.name for m in pkgutil.iter_modules(app.__path__))


def test_every_module_is_discovered():
    # Guards against the list silently going empty and the test passing vacuously.
    assert {"main", "recognition", "tutor", "resolver", "signs"} <= set(MODULES)


@pytest.mark.parametrize("name", MODULES)
def test_module_imports(name):
    importlib.import_module(f"app.{name}")


def test_recognition_defines_its_locks():
    recognition = importlib.import_module("app.recognition")
    # These are what serialize MediaPipe/Keras across FastAPI's threadpool.
    assert recognition._LOAD_LOCK is not None
    assert recognition._INFER_LOCK is not None
