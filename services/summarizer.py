import os
from dotenv import load_dotenv

load_dotenv()

class ComplaintSummarizer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.model = None
        if self.api_key and self.api_key.strip() and not self.api_key.startswith("your_"):
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-1.5-flash")
                print("[ComplaintSummarizer] Google Gemini API initialized.")
            except Exception as e:
                print(f"[ComplaintSummarizer Warning] Failed to initialize Gemini model: {e}")
        else:
            print("[ComplaintSummarizer] GEMINI_API_KEY missing or default. Fallback summarizer will be used.")

    def summarize(self, transcript: str, category: str = "Unspecified", urgency: str = "Medium"):
        if not transcript or not transcript.strip():
            raise ValueError("Transcript text cannot be empty.")

        if self.model:
            try:
                prompt = (
                    f"You are an assistant for a Citizen Call Intelligence Platform.\n"
                    f"Citizen Complaint Transcript: \"{transcript}\"\n"
                    f"Assigned Category (from ML model): {category}\n"
                    f"Assigned Urgency (from ML model): {urgency}\n\n"
                    f"Task:\n"
                    f"1. Generate a concise 2-3 line human-readable executive summary of the issue.\n"
                    f"2. Provide a 1-line reasoning text explaining why this issue requires attention.\n\n"
                    f"Respond ONLY in valid JSON format with keys 'summary' and 'reasoning'."
                )
                response = self.model.generate_content(prompt)
                text = response.text.strip()
                
                # Clean JSON code block wrappers if present
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                import json
                parsed = json.loads(text)
                return {
                    "summary": parsed.get("summary", text[:200]),
                    "reasoning": parsed.get("reasoning", f"Assigned to {category} department with {urgency} urgency based on transcript context.")
                }
            except Exception as e:
                print(f"[ComplaintSummarizer Error] Gemini call failed: {e}")

        # Structured deterministic fallback when API key is unavailable
        words = transcript.strip().split()
        short_snippet = " ".join(words[:15]) + ("..." if len(words) > 15 else "")
        return {
            "summary": f"Citizen reported a {category.lower()} issue regarding '{short_snippet}'. The matter requires administrative intervention for quick resolution.",
            "reasoning": f"Flagged as {urgency} urgency due to impact on local infrastructure and public convenience."
        }

# Global singleton helper
_summarizer_instance = None

def get_summarizer():
    global _summarizer_instance
    if _summarizer_instance is None:
        _summarizer_instance = ComplaintSummarizer()
    return _summarizer_instance
