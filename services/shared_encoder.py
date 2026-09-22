import os

# Ensure PyTorch CPU backend
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

_shared_encoder = None

def get_shared_encoder(model_name="all-MiniLM-L6-v2"):
    """
    Singleton SentenceTransformer encoder to share across
    DuplicateDetector, RAGResolutionAssist, and SpamDetector.
    Avoids loading multiple copies of transformer models in memory.
    """
    global _shared_encoder
    if _shared_encoder is None:
        print(f"[SharedEncoder] Loading singleton SentenceTransformer '{model_name}'...")
        from sentence_transformers import SentenceTransformer
        _shared_encoder = SentenceTransformer(model_name)
        print("[SharedEncoder] Singleton SentenceTransformer ready.")
    return _shared_encoder
