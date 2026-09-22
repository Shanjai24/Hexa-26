import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import chromadb
from sentence_transformers import SentenceTransformer

def seed_resolved_chroma():
    print("[SeedChroma] Initializing ChromaDB persistent client at ./chroma_db...")
    client = chromadb.PersistentClient(path="./chroma_db")
    encoder = SentenceTransformer("all-MiniLM-L6-v2")
    collection = client.get_or_create_collection(
        name="resolved_complaints",
        metadata={"hnsw:space": "cosine"}
    )

    resolved_items = [
        {
            "id": "CMP-10401",
            "text": "Water pipeline burst near Anna Nagar main road. High pressure drinking water flooding street and low water pressure in neighborhood.",
            "notes": "Isolated feeder valve at Sector 4, welded replacement 8-inch ductile iron collar, restored 2.5 bar pressure.",
            "hours": 4.2,
            "role": "Trunk Pipeline Specialist",
            "cat": "Water Supply"
        },
        {
            "id": "CMP-10402",
            "text": "Contaminated muddy tap water flowing into houses after pipeline damage in Anna Nagar West.",
            "notes": "Flushed sediment flush-valves on distribution grid, cleaned local sump, chlorination check passed at 0.4 ppm.",
            "hours": 6.5,
            "role": "Water Quality Inspector",
            "cat": "Water Supply"
        },
        {
            "id": "CMP-10403",
            "text": "Underground sewer line choked and overflowing near market pedestrian lane.",
            "notes": "Deployed super-sucker de-silting jet machine, removed root intruded debris from manhole #14.",
            "hours": 3.8,
            "role": "Sanitation Squad Lead",
            "cat": "Water Supply"
        },
        {
            "id": "CMP-10404",
            "text": "Transformer sparking loudly with burning smell and power fluctuation on Usman Road.",
            "notes": "De-energized 11kV feeder line, replaced damaged bushing and burned jumper wire, balanced phase load across phases.",
            "hours": 2.1,
            "role": "Zone Electrical Inspector",
            "cat": "Electricity Board"
        },
        {
            "id": "CMP-10405",
            "text": "Overhead high voltage cable snapped and hanging loose over road near Ambattur Industrial area.",
            "notes": "Tripped substation breaker, spliced heavy gauge AAC conductor with mechanical crimping sleeves, re-tensioned to 6m clearance.",
            "hours": 1.8,
            "role": "Senior Lineman",
            "cat": "Electricity Board"
        },
        {
            "id": "CMP-10406",
            "text": "Low voltage and frequent power trips affecting residential apartments in Velachery.",
            "notes": "Replaced corroded neutral ground conductor at distribution pillar box; verified 232V phase-to-neutral steady state.",
            "hours": 3.5,
            "role": "Substation Engineer",
            "cat": "Electricity Board"
        },
        {
            "id": "CMP-10407",
            "text": "Garbage dump bin overflowing with decaying solid waste on Mylapore main road.",
            "notes": "Dispatched 5-ton compactor truck and 4 sanitation conservancy workers; bleached area with lime powder.",
            "hours": 2.5,
            "role": "De-silting Squad Lead",
            "cat": "Sanitation"
        },
        {
            "id": "CMP-10408",
            "text": "Open drainage canal blocked with plastic waste causing stagnation and mosquito infestation.",
            "notes": "Excavated 120m canal stretch with mini-digger; sprayed anti-larval bacillus thuringiensis solution.",
            "hours": 5.0,
            "role": "Public Health Field Inspector",
            "cat": "Sanitation"
        },
        {
            "id": "CMP-10409",
            "text": "Dry grass and garbage landfill fire spreading towards parking area in Ambattur.",
            "notes": "Turned out 2 foam tenders from Ambattur Fire Station; controlled perimeter with Class A foam blanket in 25 mins.",
            "hours": 0.8,
            "role": "Station Fire Officer",
            "cat": "Fire & Rescue"
        },
        {
            "id": "CMP-10410",
            "text": "Deep road trench and dangerous pothole after underground pipe work near Guindy junction.",
            "notes": "Compacted wet mix macadam sub-base and rolled 40mm bituminous concrete cold-patch with tamper roller.",
            "hours": 7.2,
            "role": "Assistant Executive Engineer (Roads)",
            "cat": "Public Works"
        }
    ]

    for item in resolved_items:
        emb = encoder.encode(item["text"], convert_to_numpy=True).tolist()
        collection.upsert(
            ids=[item["id"]],
            embeddings=[emb],
            metadatas=[{
                "complaintId": item["id"],
                "status": "Resolved",
                "resolution_notes": item["notes"],
                "time_to_resolve_hours": float(item["hours"]),
                "officer_role": item["role"],
                "category": item["cat"]
            }],
            documents=[item["text"]]
        )

    print(f"[SeedChroma] Successfully seeded {len(resolved_items)} resolved complaint cases into 'resolved_complaints' collection.")

if __name__ == "__main__":
    seed_resolved_chroma()
