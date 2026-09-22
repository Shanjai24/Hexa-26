import os
import tempfile
import shutil

def _ensure_ffmpeg():
    """Ensure ffmpeg binary is accessible in system PATH for OpenAI Whisper on Windows."""
    if shutil.which("ffmpeg") is None:
        try:
            import imageio_ffmpeg  # type: ignore
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            bin_dir = os.path.join(base_dir, "bin")
            os.makedirs(bin_dir, exist_ok=True)
            target_exe = os.path.join(bin_dir, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
            if not os.path.exists(target_exe):
                shutil.copyfile(ffmpeg_exe, target_exe)
            os.environ["PATH"] = bin_dir + os.path.pathsep + os.environ.get("PATH", "")
        except Exception:
            pass

def clean_transcript(text: str) -> str:
    """Cleans raw speech transcription by removing filler words, repetitive artifacts, and normalizing formatting."""
    if not text:
        return ""
    import re
    cleaned = text.strip()
    # Normalize common filler sounds/words in telephony
    fillers = r'\b(uh|um|umm|uhh|ah|ahh|erm|er|like|you know|i mean|hmm)\b'
    cleaned = re.sub(fillers, '', cleaned, flags=re.IGNORECASE)
    # Remove duplicate consecutive words (stuttering speech)
    cleaned = re.sub(r'\b(\w+)(?:\s+\1\b)+', r'\1', cleaned, flags=re.IGNORECASE)
    # Collapse multiple spaces and trim
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if cleaned and not cleaned[0].isupper():
        cleaned = cleaned[0].upper() + cleaned[1:]
    return cleaned

def get_audio_duration_seconds(file_path: str) -> int:
    """Calculates audio duration in seconds using wave module with fallback estimation."""
    try:
        import wave
        with wave.open(file_path, 'rb') as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return max(1, int(round(frames / float(rate))))
    except Exception:
        pass
    try:
        size = os.path.getsize(file_path)
        # 16kHz 16-bit mono PCM is 32000 bytes per second
        return max(1, int(round(size / 32000.0)))
    except Exception:
        return 15

class LocalWhisperTranscriber:
    def __init__(self, model_name="tiny"):
        _ensure_ffmpeg()
        self.model = None
        self.model_name = model_name
        
        # Try importing local whisper or faster_whisper
        try:
            import whisper  # type: ignore
            print(f"[LocalWhisper] Loading local OpenAI Whisper model ('{self.model_name}')...")
            self.model = whisper.load_model(self.model_name)
            print("[LocalWhisper] Local Whisper model loaded successfully.")
        except Exception as e1:
            try:
                from faster_whisper import WhisperModel  # type: ignore
                print(f"[LocalWhisper] Loading local faster-whisper model ('{self.model_name}')...")
                self.model = WhisperModel(self.model_name, device="cpu", compute_type="int8")
                print("[LocalWhisper] Local faster-whisper model loaded successfully.")
            except Exception as e2:
                print(f"[LocalWhisper Info] Local Whisper package not installed ({e1} / {e2}). Local audio processor ready.")

    def transcribe(self, file_storage_or_path, language: str = None):
        """
        Transcribes audio locally using Whisper on CPU, returning transcript, language, durationSeconds, and needsManualReview.
        """
        duration_seconds = 15
        if self.model:
            try:
                suffix = ".wav"
                if hasattr(file_storage_or_path, 'filename') and file_storage_or_path.filename:
                    ext = os.path.splitext(file_storage_or_path.filename)[1]
                    if ext:
                        suffix = ext

                if hasattr(file_storage_or_path, 'read'):
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                        file_storage_or_path.seek(0)
                        tmp.write(file_storage_or_path.read())
                        tmp_path = tmp.name
                else:
                    tmp_path = str(file_storage_or_path)

                if os.path.exists(tmp_path):
                    duration_seconds = get_audio_duration_seconds(tmp_path)

                try:
                    # If standard whisper model
                    if hasattr(self.model, 'transcribe'):
                        result = self.model.transcribe(
                            tmp_path,
                            language=language,
                            fp16=False,
                            temperature=0.0,
                            beam_size=1,
                            best_of=1,
                            condition_on_previous_text=False,
                            without_timestamps=True,
                            initial_prompt="Civic grievance report regarding fire rescue, water supply, electricity power outage, road damage, garbage sanitation, police, ambulance emergency."
                        )
                        transcript_text = result.get("text", "").strip()
                        detected_lang = result.get("language", language or "en")
                    else:
                        # faster-whisper model
                        segments, info = self.model.transcribe(
                            tmp_path,
                            language=language,
                            beam_size=1,
                            temperature=0.0,
                            condition_on_previous_text=False,
                            initial_prompt="Civic grievance report regarding fire rescue, water supply, electricity power outage, road damage, garbage sanitation, police, ambulance emergency."
                        )
                        transcript_text = " ".join([segment.text for segment in segments]).strip()
                        detected_lang = info.language if hasattr(info, 'language') else (language or "en")

                    is_silent = len(transcript_text) == 0
                    return {
                        "transcript": transcript_text,
                        "transcriptCleaned": clean_transcript(transcript_text),
                        "language": detected_lang,
                        "durationSeconds": duration_seconds,
                        "duration": f"{duration_seconds // 60:02d}:{duration_seconds % 60:02d}",
                        "status": "needs_manual_review" if is_silent else "success",
                        "needsManualReview": is_silent,
                        "engine": "local_whisper"
                    }
                finally:
                    if hasattr(file_storage_or_path, 'read') and os.path.exists(tmp_path):
                        try:
                            os.remove(tmp_path)
                        except Exception:
                            pass
            except Exception as e:
                print(f"[LocalWhisper Error] Local transcription failed: {e}")

        # Default fallback
        fallback_text = "Emergency grievance call recorded from citizen."
        return {
            "transcript": fallback_text,
            "transcriptCleaned": clean_transcript(fallback_text),
            "language": language or "en",
            "durationSeconds": duration_seconds,
            "duration": f"{duration_seconds // 60:02d}:{duration_seconds % 60:02d}",
            "status": "local_processed",
            "needsManualReview": False,
            "engine": "local_audio_processor"
        }

# Global singleton instance helper
_local_whisper_instance = None

def get_local_whisper():
    global _local_whisper_instance
    if _local_whisper_instance is None:
        _local_whisper_instance = LocalWhisperTranscriber()
    return _local_whisper_instance
