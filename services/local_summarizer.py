import os
import re

class LocalSummarizer:
    def __init__(self):
        self.pipeline = None
        # Disable TensorFlow backend to prevent Protobuf version errors
        os.environ["USE_TF"] = "0"
        os.environ["USE_TORCH"] = "1"
        
        # Check if user explicitly wants to download HuggingFace model
        if os.getenv("ENABLE_HF_DOWNLOAD") == "1":
            try:
                from transformers import pipeline  # type: ignore
                print("[LocalSummarizer] Attempting lazy load of HuggingFace local model...")
                self.pipeline = pipeline(
                    "summarization",
                    model="sshleifer/distilbart-cnn-6-6",
                    tokenizer="sshleifer/distilbart-cnn-6-6",
                    framework="pt"
                )
                print("[LocalSummarizer] HuggingFace local summarizer loaded.")
            except Exception as e:
                print(f"[LocalSummarizer Info] HuggingFace model skipped ({e}). Using local NLP summarizer.")
        else:
            print("[LocalSummarizer] Fast local extractive NLP summarizer active (Zero network downloads needed).")

    def summarize(self, transcript: str, category: str = "General", urgency: str = "Medium"):
        if not transcript or not transcript.strip():
            raise ValueError("Transcript text cannot be empty.")

        text = transcript.strip()

        # Try HuggingFace pipeline if enabled & loaded
        if self.pipeline:
            try:
                if len(text.split()) >= 10:
                    res = self.pipeline(text, max_length=60, min_length=15, do_sample=False)
                    if res and len(res) > 0:
                        return {
                            "summary": res[0]["summary_text"],
                            "reasoning": f"Local NLP summarized issue under {category} department with {urgency} priority."
                        }
            except Exception as e:
                print(f"[LocalSummarizer Error] HuggingFace summarization error: {e}")

        # Instant 100% Offline Local Extractive Summarizer
        sentences = re.split(r'(?<=[.!?])\s+', text)
        if len(sentences) == 1:
            summary = text
        elif len(sentences) <= 3:
            summary = " ".join(sentences)
        else:
            summary = f"{sentences[0]} {sentences[-1]}"

        reasoning = f"Automated local analysis identified {category.lower()} issue flagged at {urgency.lower()} urgency based on citizen call transcript."

        return {
            "summary": summary,
            "reasoning": reasoning
        }

# Global singleton instance helper
_local_summarizer_instance = None

def get_local_summarizer():
    global _local_summarizer_instance
    if _local_summarizer_instance is None:
        _local_summarizer_instance = LocalSummarizer()
    return _local_summarizer_instance
