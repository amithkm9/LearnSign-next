"""
Sign recognition (numbers/letters) folded in from the legacy sign_recognition
service. Heavy deps (tensorflow, mediapipe, opencv) are imported LAZILY on the
first /recognize call so chat/voice/report startup stays fast.

The labels .pkl was missing in the legacy repo, so labels are hardcoded to the
model's 6 training classes.
"""

import base64
from pathlib import Path

# The .h5 was saved with Keras 3 (uses `batch_shape`), so we load it with
# TF 2.16's default Keras 3 — do NOT force TF_USE_LEGACY_KERAS here.

MODEL_PATH = Path(__file__).parent / "models" / "sign_language_numbers_letters.h5"
LABELS = ["one", "two", "three", "a", "b", "c"]
SEQUENCE_LENGTH = 30

_model = None
_hands = None

# FastAPI runs the sync /recognize endpoint in a threadpool, so several requests
# can land here at once. Neither MediaPipe's `Hands` nor Keras `predict` is
# thread-safe, and `Hands` additionally carries frame-to-frame tracking state —
# concurrent quizzes would corrupt each other's landmarks. `_LOAD_LOCK` keeps two
# cold requests from each loading the model (a likely OOM on a small instance);
# `_INFER_LOCK` serializes the actual inference.
_LOAD_LOCK = threading.Lock()
_INFER_LOCK = threading.Lock()


def _ensure_loaded():
    global _model, _hands
    if _model is not None and _hands is not None:
        return
    with _LOAD_LOCK:
        # Re-check: another thread may have finished loading while we waited.
        if _model is None:
            import tensorflow as tf

            _model = tf.keras.models.load_model(str(MODEL_PATH))
        if _hands is None:
            # Explicit submodule path — `mediapipe.solutions` isn't always exposed
            # as an attribute in 0.10.x, especially off the main thread.
            import mediapipe as mp

            _hands = mp.solutions.hands.Hands(
                # Each request is an independent burst of frames from a different
                # user, so tracking state must NOT persist between calls.
                static_image_mode=True,
                max_num_hands=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )


def _b64_to_image(s: str):
    import cv2
    import numpy as np

    if "data:image" in s:
        s = s.split(",")[1]
    arr = np.frombuffer(base64.b64decode(s), np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _landmarks(frame):
    import cv2

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = _hands.process(rgb)
    if result.multi_hand_landmarks:
        return [[lm.x, lm.y, lm.z] for lm in result.multi_hand_landmarks[0].landmark]
    return None


def _preprocess(sequence):
    import numpy as np

    if len(sequence) < SEQUENCE_LENGTH:
        sequence = sequence + [sequence[-1]] * (SEQUENCE_LENGTH - len(sequence))
    elif len(sequence) > SEQUENCE_LENGTH:
        sequence = sequence[:SEQUENCE_LENGTH]

    out = []
    for landmarks in sequence:
        a = np.array(landmarks)
        centered = a - a[0]  # center on wrist
        max_dist = np.max(np.abs(centered))
        out.append((centered / max_dist if max_dist > 0 else centered).flatten())
    return np.array(out)


def recognize(frames: list[str]) -> dict:
    if not frames:
        return {
            "detected_sign": "unknown",
            "confidence": 0.0,
            "message": "No frames provided",
        }

    import numpy as np

    _ensure_loaded()

    # Decode outside the lock — it's pure CPU work with no shared state.
    images = []
    for frame_b64 in frames:
        try:
            img = _b64_to_image(frame_b64)
            if img is not None:
                images.append(img)
        except Exception:
            continue  # skip unreadable frames

    # MediaPipe and Keras are not thread-safe; one request at a time past here.
    with _INFER_LOCK:
        all_landmarks = []
        for img in images:
            try:
                lm = _landmarks(img)
                if lm is not None:
                    all_landmarks.append(lm)
            except Exception:
                continue

        if not all_landmarks:
            return {
                "detected_sign": "unknown",
                "confidence": 0.0,
                "message": "No hand detected",
            }

        sequence = _preprocess(all_landmarks)
        prediction = _model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
    idx = int(np.argmax(prediction))
    confidence = float(prediction[idx])
    detected = LABELS[idx] if idx < len(LABELS) else "unknown"
    all_predictions = {
        LABELS[i]: float(prediction[i])
        for i in range(min(len(LABELS), len(prediction)))
    }

    return {
        "detected_sign": detected,
        "confidence": confidence,
        "all_predictions": all_predictions,
        "message": f"Hand detected in {len(all_landmarks)}/{len(frames)} frames",
    }
