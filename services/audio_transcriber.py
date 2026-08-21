import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

class AudioTranscriber:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"):
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
                print("[AudioTranscriber] OpenAI client initialized for Whisper API.")
            except Exception as e:
                print(f"[AudioTranscriber Warning] Failed to initialize OpenAI client: {e}")
        else:
            print("[AudioTranscriber] OPENAI_API_KEY missing or default. Fallback mock transcriber will be used.")

    def transcribe(self, file_storage_or_path, language: str = None):
        """
        Transcribes audio file using OpenAI Whisper API.
        Supports multilingual audio (English, Hindi, Tamil, etc.).
        """
        if self.client:
            try:
                # Handle Flask FileStorage or file path
                if hasattr(file_storage_or_path, 'read'):
                    # Create temporary file to pass to OpenAI SDK
                    suffix = ".wav"
                    if hasattr(file_storage_or_path, 'filename') and file_storage_or_path.filename:
                        ext = os.path.splitext(file_storage_or_path.filename)[1]
                        if ext:
                            suffix = ext

                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                        file_storage_or_path.seek(0)
                        tmp.write(file_storage_or_path.read())
                        tmp_path = tmp.name

                    try:
                        with open(tmp_path, "rb") as audio_file:
                            kwargs = {"model": "whisper-1", "file": audio_file}
                            if language:
                                kwargs["language"] = language
                            response = self.client.audio.transcriptions.create(**kwargs)
                            detected_lang = getattr(response, 'language', language or 'detected')
                            return {
                                "transcript": response.text,
                                "language": detected_lang,
                                "status": "success"
                            }
                    finally:
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
                elif isinstance(file_storage_or_path, str) and os.path.exists(file_storage_or_path):
                    with open(file_storage_or_path, "rb") as audio_file:
                        kwargs = {"model": "whisper-1", "file": audio_file}
                        if language:
                            kwargs["language"] = language
                        response = self.client.audio.transcriptions.create(**kwargs)
                        detected_lang = getattr(response, 'language', language or 'detected')
                        return {
                            "transcript": response.text,
                            "language": detected_lang,
                            "status": "success"
                        }
            except Exception as e:
                print(f"[AudioTranscriber Error] Whisper API call failed: {e}")
                return {
                    "transcript": "Error executing Whisper transcription. Check OpenAI API key and network connection.",
                    "language": "unknown",
                    "status": "error",
                    "error": str(e)
                }

        # Mock fallback implementation for testing
        return {
            "transcript": "Main water supply pipeline burst in Ward 12 near Green Park metro station, severe water leakage on main road.",
            "language": language or "en",
            "status": "mock_success",
            "note": "Mock response used because OPENAI_API_KEY is not configured."
        }

# Global singleton helper
_transcriber_instance = None

def get_audio_transcriber():
    global _transcriber_instance
    if _transcriber_instance is None:
        _transcriber_instance = AudioTranscriber()
    return _transcriber_instance
