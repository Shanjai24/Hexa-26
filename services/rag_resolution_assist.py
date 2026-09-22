import os
import datetime

# Ensure torch backend
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import chromadb
from services.shared_encoder import get_shared_encoder


class RAGResolutionAssist:
    def __init__(self, db_path="./chroma_db", model_name="all-MiniLM-L6-v2"):
        print(f"[RAGResolutionAssist] Initializing ChromaDB PersistentClient at '{db_path}'...")
        self.chroma_client = chromadb.PersistentClient(path=db_path)

        self.encoder = get_shared_encoder(model_name)

        # Dedicated ChromaDB collection for resolved complaints
        self.collection = self.chroma_client.get_or_create_collection(
            name="resolved_complaints",
            metadata={"hnsw:space": "cosine"}
        )
        print("[RAGResolutionAssist] ChromaDB collection 'resolved_complaints' ready.")

    def get_embedding(self, text: str):
        embedding = self.encoder.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def sync_resolved_case(
        self,
        complaint_id: str,
        transcript: str,
        resolution_notes: str,
        time_to_resolve_hours: float,
        officer_role: str = "Field Engineer",
        category: str = "General"
    ):
        """Adds or updates a resolved complaint in ChromaDB with resolution notes metadata."""
        if not transcript or not transcript.strip():
            transcript = f"{category} complaint resolved: {resolution_notes}"

        embedding = self.get_embedding(transcript)
        metadata = {
            "complaintId": str(complaint_id),
            "status": "Resolved",
            "resolution_notes": str(resolution_notes or "Field inspection and corrective repair completed."),
            "time_to_resolve_hours": float(time_to_resolve_hours if time_to_resolve_hours is not None else 4.0),
            "officer_role": str(officer_role or "Field Engineer"),
            "category": str(category or "General"),
            "resolved_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

        self.collection.upsert(
            ids=[str(complaint_id)],
            embeddings=[embedding],
            metadatas=[metadata],
            documents=[transcript[:500]]
        )
        return {"status": "synced", "complaintId": complaint_id}

    def get_similar_resolved(self, query_text: str, top_k: int = 3, category: str = None) -> list:
        """Queries ChromaDB for the top_k most similar resolved complaints."""
        if not query_text or not query_text.strip():
            return []

        embedding = self.get_embedding(query_text)
        
        # Query ChromaDB collection where status is Resolved
        count = self.collection.count()
        if count == 0:
            return []

        n_results = min(top_k, count)
        where_clause = {"status": "Resolved"}

        query_results = self.collection.query(
            query_embeddings=[embedding],
            n_results=n_results,
            where=where_clause
        )

        matches = []
        if query_results and query_results.get("ids") and len(query_results["ids"]) > 0:
            ids = query_results["ids"][0]
            distances = query_results["distances"][0]
            metadatas = query_results["metadatas"][0]

            for i in range(len(ids)):
                sim = max(0.0, min(1.0, 1.0 - distances[i]))
                meta = metadatas[i] or {}
                matches.append({
                    "complaintId": ids[i],
                    "similarity": round(float(sim), 3),
                    "resolutionNotes": meta.get("resolution_notes", "Standard maintenance protocol followed."),
                    "timeToResolveHours": meta.get("time_to_resolve_hours", 4.0),
                    "assignedRole": meta.get("officer_role", "Field Engineer"),
                    "category": meta.get("category", "General")
                })

        return matches


# Singleton helper
_rag_assist_instance = None

def get_rag_resolution_assist():
    global _rag_assist_instance
    if _rag_assist_instance is None:
        _rag_assist_instance = RAGResolutionAssist()
    return _rag_assist_instance
