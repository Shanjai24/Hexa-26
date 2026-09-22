import os
import uuid
import datetime

# Ensure torch backend
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import chromadb
from sentence_transformers import SentenceTransformer


class SpamDetector:
    SIMILARITY_THRESHOLD = 0.90  # Cosine similarity > 0.90 flags near-identical repeat calls

    def __init__(self, db_path="./chroma_db", model_name="all-MiniLM-L6-v2"):
        print(f"[SpamDetector] Initializing ChromaDB PersistentClient at '{db_path}'...")
        self.chroma_client = chromadb.PersistentClient(path=db_path)

        print(f"[SpamDetector] Loading SentenceTransformer model '{model_name}'...")
        self.encoder = SentenceTransformer(model_name)

        # Dedicated ChromaDB collection for caller history separate from complaint dedup
        self.collection = self.chroma_client.get_or_create_collection(
            name="caller_history",
            metadata={"hnsw:space": "cosine"}
        )
        print("[SpamDetector] ChromaDB collection 'caller_history' ready.")

    def get_embedding(self, text: str):
        embedding = self.encoder.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def check_spam(self, phone_number: str, transcript: str, call_record_id: str = None, total_calls_24h: int = 1) -> dict:
        """
        Evaluates repeat-caller spam likelihood based on:
        1. 24h call frequency from this number (>4 calls -> +0.4)
        2. Semantic similarity to prior calls from SAME number only (>0.90 -> +0.5)
        Threshold >= 0.6 triggers isFlaggedSpam = True.
        """
        clean_phone = str(phone_number or '').strip()
        text = str(transcript or '').strip()

        if not text:
            return {
                "isFlaggedSpam": False,
                "spamScore": 0.0,
                "reason": "Empty transcript"
            }

        embedding = self.get_embedding(text)
        base_score = 0.0
        reasons = []

        # 1. Look up prior calls from this exact phone number in ChromaDB
        query_results = self.collection.query(
            query_embeddings=[embedding],
            n_results=5,
            where={"phoneNumber": clean_phone} if clean_phone else None
        )

        max_sim = 0.0
        prior_call_count = 0

        if query_results and query_results.get("distances") and len(query_results["distances"]) > 0:
            distances = query_results["distances"][0]
            prior_call_count = len(distances)
            for d in distances:
                # ChromaDB cosine distance = 1 - cosine_similarity
                sim = 1.0 - d
                if sim > max_sim:
                    max_sim = sim

        # 2. Check 24-hour call frequency (>4 calls in 24h)
        effective_calls = max(total_calls_24h, prior_call_count + 1)
        if effective_calls > 4:
            base_score += 0.4
            reasons.append(f"High call volume ({effective_calls} calls in 24h)")

        # 3. Check semantic similarity against prior calls from same number
        if prior_call_count > 0 and max_sim >= self.SIMILARITY_THRESHOLD:
            base_score += 0.5
            reasons.append(f"Near-identical transcript to prior call ({round(max_sim * 100, 1)}% match)")

        # 4. First-time caller safeguard
        if prior_call_count == 0 and effective_calls <= 1:
            base_score = 0.0
            reasons = ["Verified first-time caller"]

        is_flagged = base_score >= 0.6
        reason_str = " • ".join(reasons) if reasons else ("Normal inquiry pattern" if not is_flagged else "Spam pattern detected")

        # 5. Store current call embedding with phone metadata
        record_id = call_record_id or f"call-{uuid.uuid4().hex[:8]}"
        try:
            self.collection.upsert(
                ids=[record_id],
                embeddings=[embedding],
                metadatas=[{
                    "phoneNumber": clean_phone,
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    "transcript_preview": text[:120]
                }]
            )
        except Exception as e:
            print(f"[SpamDetector Warning] Error persisting call embedding: {e}")

        return {
            "isFlaggedSpam": bool(is_flagged),
            "spamScore": round(float(base_score), 2),
            "reason": reason_str,
            "maxSimilarity": round(float(max_sim), 3),
            "totalCalls24h": effective_calls
        }


# Singleton helper
_spam_detector_instance = None

def get_spam_detector():
    global _spam_detector_instance
    if _spam_detector_instance is None:
        _spam_detector_instance = SpamDetector()
    return _spam_detector_instance
