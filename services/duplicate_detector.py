import os
import uuid
import datetime

# Disable TensorFlow backend in transformers to avoid Protobuf version mismatch
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import chromadb
from sentence_transformers import SentenceTransformer


class DuplicateDetector:
    SIMILARITY_THRESHOLD = 0.85  # Cosine similarity > 0.85 is considered a duplicate

    def __init__(self, db_path="./chroma_db", model_name="all-MiniLM-L6-v2"):
        print(f"[DuplicateDetector] Initializing ChromaDB PersistentClient at '{db_path}'...")
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        
        print(f"[DuplicateDetector] Loading SentenceTransformer model '{model_name}'...")
        self.encoder = SentenceTransformer(model_name)
        
        # Retrieve or create ChromaDB collection with cosine distance space
        self.collection = self.chroma_client.get_or_create_collection(
            name="citizen_complaints",
            metadata={"hnsw:space": "cosine"}
        )
        print("[DuplicateDetector] ChromaDB collection 'citizen_complaints' ready.")

    def get_embedding(self, text: str):
        embedding = self.encoder.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def check_and_store(self, text: str, category: str = "Other", urgency: str = "Medium"):
        if not text or not text.strip():
            raise ValueError("Transcript text cannot be empty.")

        embedding = self.get_embedding(text)
        
        # Query ChromaDB collection within the same category
        query_results = self.collection.query(
            query_embeddings=[embedding],
            n_results=1,
            where={"category": category} if category else None
        )

        is_duplicate = False
        similarity_score = 0.0
        matching_complaint = None
        matched_id = None

        if query_results and query_results.get("distances") and len(query_results["distances"][0]) > 0:
            distance = query_results["distances"][0][0]
            # ChromaDB cosine distance = 1 - cosine_similarity
            similarity = 1.0 - distance
            similarity_score = round(float(similarity), 4)

            if similarity >= self.SIMILARITY_THRESHOLD:
                is_duplicate = True
                matched_id = query_results["ids"][0][0]
                matched_metadata = query_results["metadatas"][0][0] if query_results.get("metadatas") else {}
                matching_complaint = query_results["documents"][0][0] if query_results.get("documents") else None

        record_id = str(uuid.uuid4())
        
        # If not duplicate, store new embedding into ChromaDB
        if not is_duplicate:
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            self.collection.add(
                ids=[record_id],
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "category": category,
                    "urgency": urgency,
                    "timestamp": now_iso
                }]
            )

        return {
            "isDuplicate": is_duplicate,
            "similarityScore": similarity_score,
            "matchedId": matched_id,
            "matchingSnippet": matching_complaint,
            "storedId": record_id if not is_duplicate else matched_id,
            "threshold": self.SIMILARITY_THRESHOLD
        }

# Global singleton helper
_detector_instance = None

def get_duplicate_detector():
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = DuplicateDetector()
    return _detector_instance
