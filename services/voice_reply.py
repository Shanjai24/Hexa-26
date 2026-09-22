"""
Feature 13 — Closed-Loop Voice Reply (Local Text-to-Speech)
Uses pyttsx3 (fully offline, cross-platform) to generate a WAV confirmation
audio file that is played back to the citizen after their complaint is filed.

Gracefully degrades: if pyttsx3 is unavailable or fails, returns None
so complaint creation is never blocked by a missing TTS dependency.
"""
import os
import uuid

CONFIRMATIONS_DIR = os.path.join("uploads", "confirmations")


def _ensure_dir():
    os.makedirs(CONFIRMATIONS_DIR, exist_ok=True)


def generate_confirmation_audio(
    ticket_id: str,
    department_name: str,
    language: str = "en"
) -> str | None:
    """
    Generate a WAV file with spoken ticket confirmation.
    Returns the file path on success, or None if TTS is unavailable.

    The audio says:
      "Your complaint has been filed as [ticket_id] and routed to
       [department_name]. You will receive updates on your registered
       phone number. Thank you for contacting CivicSense."

    language parameter is accepted for future i18n expansion; currently
    English is always used because pyttsx3 voice availability depends on
    the deployment OS. Document this limitation explicitly.
    """
    try:
        import pyttsx3  # type: ignore
    except ImportError:
        print("[VoiceReply] pyttsx3 not installed — skipping TTS confirmation.")
        return None

    _ensure_dir()

    # Speak ticket ID digit-by-digit for clarity (e.g. "C M P dash 1 0 4 5 2")
    spoken_id = " ".join(ticket_id)

    text = (
        f"Your complaint has been filed as {spoken_id} "
        f"and routed to {department_name}. "
        f"You will receive updates on your registered phone number. "
        f"Thank you for contacting Civic Sense."
    )

    filename = f"{ticket_id}_{uuid.uuid4().hex[:6]}.wav"
    output_path = os.path.join(CONFIRMATIONS_DIR, filename)

    try:
        engine = pyttsx3.init()

        # Slightly slower rate for clarity (default ~200 wpm)
        engine.setProperty("rate", 160)
        engine.setProperty("volume", 0.95)

        engine.save_to_file(text, output_path)
        engine.runAndWait()

        # pyttsx3 may write an empty file on some Linux setups without a
        # speech engine — treat that as a failure
        if not os.path.exists(output_path) or os.path.getsize(output_path) < 100:
            print(f"[VoiceReply] TTS produced empty/missing file at {output_path}. Skipping.")
            return None

        print(f"[VoiceReply] Confirmation audio written: {output_path}")
        return output_path

    except Exception as e:
        print(f"[VoiceReply] TTS engine error: {e}. Falling back to text-only confirmation.")
        # Clean up any partial file
        if os.path.exists(output_path):
            try:
                os.remove(output_path)
            except Exception:
                pass
        return None


def get_audio_url(file_path: str) -> str | None:
    """
    Convert an absolute/relative file path to a URL path served by the
    Flask /confirmations/<filename> static route.
    """
    if not file_path:
        return None
    filename = os.path.basename(file_path)
    return f"/confirmations/{filename}"
