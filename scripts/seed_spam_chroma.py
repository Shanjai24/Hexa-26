"""
seed_spam_chroma.py
Seeds ChromaDB caller_history collection with 5 near-identical transcripts from
the demo spam number (+919840499999) so the cosine-similarity check fires and
isFlaggedSpam actually returns True in the verification demo.

Run once after starting the platform:
  python scripts/seed_spam_chroma.py
"""
import os
import sys
import datetime

os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import chromadb
from sentence_transformers import SentenceTransformer

SPAM_PHONE = "+919840499999"
CHROMA_PATH = "./chroma_db"

# These transcripts are intentionally near-identical — they simulate a repeat
# nuisance caller saying essentially the same thing 5 times in 24 hours.
SPAM_TRANSCRIPTS = [
    "hello testing testing helpline is anyone there hello hello",
    "hello testing testing helpline line is anyone there hello",
    "hello testing helpline is anyone there testing testing hello",
    "hello hello testing helpline testing is anyone there hello",
    "testing hello helpline is anyone there hello testing hello",
]

def main():
    print(f"[SeedSpamChroma] Connecting to ChromaDB at '{CHROMA_PATH}'...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    print("[SeedSpamChroma] Loading SentenceTransformer all-MiniLM-L6-v2...")
    encoder = SentenceTransformer("all-MiniLM-L6-v2")

    collection = client.get_or_create_collection(
        name="caller_history",
        metadata={"hnsw:space": "cosine"}
    )

    existing = collection.get(where={"phoneNumber": SPAM_PHONE})
    if existing and existing.get("ids") and len(existing["ids"]) >= 5:
        print(f"[SeedSpamChroma] Already seeded {len(existing['ids'])} entries for {SPAM_PHONE}. Skipping.")
        return

    now = datetime.datetime.now(datetime.timezone.utc)
    ids = []
    embeddings = []
    metadatas = []

    for i, text in enumerate(SPAM_TRANSCRIPTS):
        emb = encoder.encode(text, convert_to_numpy=True).tolist()
        ids.append(f"spam-seed-{i+1:03d}")
        embeddings.append(emb)
        ts = (now - datetime.timedelta(hours=i+1)).isoformat()
        metadatas.append({
            "phoneNumber": SPAM_PHONE,
            "timestamp": ts,
            "transcript_preview": text[:120]
        })

    collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas)
    print(f"[SeedSpamChroma] Seeded {len(ids)} spam call embeddings for {SPAM_PHONE}.")

    # Verify — query with same text, should get high similarity
    query_emb = encoder.encode(SPAM_TRANSCRIPTS[0], convert_to_numpy=True).tolist()
    results = collection.query(
        query_embeddings=[query_emb],
        n_results=5,
        where={"phoneNumber": SPAM_PHONE}
    )
    distances = results["distances"][0] if results.get("distances") else []
    similarities = [round(1.0 - d, 3) for d in distances]
    max_sim = max(similarities) if similarities else 0.0
    print(f"[SeedSpamChroma] Verification — max cosine similarity: {max_sim}")
    if max_sim >= 0.90:
        print("[SeedSpamChroma] PASS: Similarity >= 0.90, spam detection will fire correctly.")
    else:
        print(f"[SeedSpamChroma] WARNING: max_sim={max_sim} < 0.90. Spam may not trigger.")
    print("[SeedSpamChroma] Done.")

if __name__ == "__main__":
    main()
