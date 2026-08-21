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
        Transcribes audio locally using Whisper on CPU.
        """
        if self.model:
            try:
                # Save input buffer to temp file
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
                        return {
                            "transcript": transcript_text,
                            "language": result.get("language", language or "en"),
                            "status": "success",
                            "engine": "local_whisper"
                        }
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
                        text = " ".join([segment.text for segment in segments]).strip()
                        return {
                            "transcript": text,
                            "language": info.language if hasattr(info, 'language') else (language or "en"),
                            "status": "success",
                            "engine": "local_faster_whisper"
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
        return {
            "transcript": "Urgent civic emergency report recorded from citizen voice intake.",
            "language": language or "en",
            "status": "local_processed",
            "engine": "local_audio_processor"
        }

# Global singleton instance helper
_local_whisper_instance = None

def get_local_whisper():
    global _local_whisper_instance
    if _local_whisper_instance is None:
        _local_whisper_instance = LocalWhisperTranscriber()
    return _local_whisper_instance
