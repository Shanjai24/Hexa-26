import os
import random
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

# Define categories, urgencies, and sentiments
CATEGORIES = [
    "Fire & Rescue",
    "Water Board",
    "Electricity Board",
    "Sanitation",
    "Public Works",
    "Police",
    "Healthcare",
    "Transport",
    "Municipal Corporation"
]
URGENCIES = ["Low", "Medium", "High", "Emergency"]
SENTIMENTS = ["Positive", "Neutral", "Negative", "Frustrated"]

# Rich seed templates with category AND problemType for all 9 departments
FIRE_COMPLAINTS = [
    ("Fire broke out in commercial building near main market, urgent fire rescue needed!", "Fire & Rescue", "Building Fire", "Emergency", "Frustrated"),
    ("Heavy smoke and flames coming from chemical warehouse, send fire engine immediately.", "Fire & Rescue", "Building Fire", "Emergency", "Frustrated"),
    ("Cylinder blast in residential apartment, fire spreading fast, call fire station rescue team.", "Fire & Rescue", "Cylinder Explosion", "Emergency", "Frustrated"),
    ("Forest and bush fire spreading near highway residential colony, need firefighters and water tenders.", "Fire & Rescue", "Wildfire Hazard", "Emergency", "Frustrated"),
    ("Fire in garbage dump yard emitting toxic black smoke and spreading to nearby shops.", "Fire & Rescue", "Garbage Fire", "High", "Frustrated"),
    ("Electrical short circuit fire in basement parking, smoke alarm ringing and people trapped.", "Fire & Rescue", "Electrical Fire", "Emergency", "Frustrated"),
    ("Vehicle caught fire on main flyover, road blocked, fire brigade and rescue needed immediately.", "Fire & Rescue", "Vehicle Fire", "Emergency", "Frustrated"),
    ("Fire emergency at local textile godown, blaze spreading rapidly to adjoining houses.", "Fire & Rescue", "Building Fire", "Emergency", "Frustrated"),
    ("Aag lag gayi hai factory me, jaldi fire brigade aur rescue team bhejo.", "Fire & Rescue", "Building Fire", "Emergency", "Frustrated"),
    ("Thee pidithullathu, urgent fire station rescue and fire engine required.", "Fire & Rescue", "Building Fire", "Emergency", "Frustrated"),
    ("Smoke coming out of closed shop, smell of burning wire and gas leak.", "Fire & Rescue", "Electrical Fire", "High", "Frustrated")
]

WATER_COMPLAINTS = [
    ("There is no water supply in our colony since yesterday morning. Pipeline issue.", "Water Board", "No Supply", "High", "Frustrated"),
    ("Low water pressure in Sector 4 Ward 12. Kindly inspect the pump house.", "Water Board", "Low Pressure", "Medium", "Neutral"),
    ("Main water pipe burst near Green Park metro station. Water flooding the road!", "Water Board", "Pipe Damage", "Emergency", "Frustrated"),
    ("Contaminated yellow muddy water coming out of taps in Shastri Nagar.", "Water Board", "Water Quality", "High", "Negative"),
    ("Water tank billing issue, I was overcharged for this month.", "Water Board", "Billing Issue", "Low", "Negative"),
    ("Thank you water department for repairing the broken pipe quickly today.", "Water Board", "Pipe Damage", "Low", "Positive"),
    ("Pani nahi aa raha 2 din se, please jaldi saaf pani ki supply shuru karein.", "Water Board", "No Supply", "High", "Frustrated"),
    ("Paani ki pipe leak ho rahi hai main road par, bahut paani waste ho raha hai.", "Water Board", "Pipe Damage", "Medium", "Negative"),
    ("Water tanker driver is asking for extra money illegally in Ward 5.", "Water Board", "Billing Issue", "High", "Frustrated"),
    ("Drinking water line damaged during digging, water supply completely cut off.", "Water Board", "No Supply", "High", "Frustrated")
]

ELECTRICITY_COMPLAINTS = [
    ("Power outage in Phase 2 for past 6 hours. Transformer sparked and caught fire!", "Electricity Board", "Transformer Fire", "Emergency", "Frustrated"),
    ("Frequent voltage fluctuations damaging home electronics in Ward 9.", "Electricity Board", "Voltage Fluctuation", "High", "Negative"),
    ("Incorrect electricity bill generated, showing 10x normal consumption.", "Electricity Board", "Meter Defect", "Medium", "Negative"),
    ("Electric wire hanging dangerous and low near primary school entrance.", "Electricity Board", "Dangling Wire", "Emergency", "Frustrated"),
    ("Power cut scheduled without prior notice in industrial layout.", "Electricity Board", "Power Outage", "Medium", "Negative"),
    ("Bijli chali gayi hai 4 ghante se, transformer se dhuwa nikla hai.", "Electricity Board", "Power Outage", "Emergency", "Frustrated"),
    ("Volt-ampere drop is causing refrigerator to trip continuously.", "Electricity Board", "Voltage Fluctuation", "Medium", "Neutral"),
    ("Smart meter showing faulty readings after heavy rainfall.", "Electricity Board", "Meter Defect", "Medium", "Negative"),
    ("Streetlight pole sparking continuously with loose wiring.", "Electricity Board", "Dangling Wire", "High", "Frustrated")
]

SANITATION_COMPLAINTS = [
    ("Garbage collection vehicle not coming for last 4 days in Block D.", "Sanitation", "Garbage Pile", "High", "Frustrated"),
    ("Sewage water mixing with rainwater and overflowing on main street.", "Sanitation", "Sewage Overflow", "Emergency", "Frustrated"),
    ("Dead animal lying on public road needs immediate sanitary removal.", "Sanitation", "Sanitation", "High", "Frustrated"),
    ("Kachra nahi uthaya gaya 3 din se, severe smell in entire lane.", "Sanitation", "Garbage Pile", "High", "Frustrated"),
    ("Open garbage dump overflowing on pedestrian walkway outside school.", "Sanitation", "Garbage Pile", "High", "Frustrated"),
    ("Drainage line choked and blocked with plastic waste causing backflow.", "Sanitation", "Sewage Overflow", "High", "Frustrated"),
    ("Public toilet in market complex completely uncleaned and unusable.", "Sanitation", "Sanitation", "Medium", "Negative")
]

PUBLIC_WORKS_COMPLAINTS = [
    ("Massive potholes on main road causing severe traffic jams and bike accidents.", "Public Works", "Potholes", "High", "Frustrated"),
    ("Open manhole on main street dangerous for pedestrians and children!", "Public Works", "Open Manhole", "Emergency", "Frustrated"),
    ("Road damaged and cracked after heavy rainfall, need urgent resurfacing.", "Public Works", "Potholes", "Medium", "Negative"),
    ("Stormwater drain slab broken and collapsed into drain on 2nd Avenue.", "Public Works", "Open Manhole", "High", "Frustrated"),
    ("Bridge expansion joint damaged and vibrating dangerously under traffic.", "Public Works", "Bridge Defect", "Emergency", "Frustrated"),
    ("Pedestrian sidewalk paving stones dug up and left unfinished.", "Public Works", "Potholes", "Medium", "Negative"),
    ("Underpass flooded with 3 feet of water, road completely impassable.", "Public Works", "Potholes", "High", "Frustrated")
]

POLICE_COMPLAINTS = [
    ("Chain snatching incident reported near central park 30 mins ago. Suspect ran away.", "Police", "Theft", "Emergency", "Frustrated"),
    ("Loud speakers playing beyond midnight illegally near residential area.", "Police", "Noise Complaint", "Medium", "Frustrated"),
    ("Illegal parking blocking emergency ambulance entry route to building.", "Police", "Traffic Violation", "High", "Frustrated"),
    ("Attempted burglary at locked house in B-Block, door lock tampered.", "Police", "Theft", "Emergency", "Frustrated"),
    ("Drunk persons creating public nuisance and harassing pedestrians at bus stop.", "Police", "Public Safety", "High", "Frustrated"),
    ("Vehicle stolen from apartment parking lot last night.", "Police", "Theft", "High", "Frustrated"),
    ("Traffic signal violation causing near accidents daily at cross junction.", "Police", "Traffic Violation", "Medium", "Negative")
]

HEALTH_COMPLAINTS = [
    ("Primary Health Centre doctor absent during official duty hours.", "Healthcare", "Doctor Absence", "High", "Frustrated"),
    ("Mosquito breeding in stagnant water spreading Dengue and Malaria outbreak.", "Healthcare", "Mosquito Hazard", "High", "Frustrated"),
    ("Government hospital emergency room out of basic lifesaving medicines.", "Healthcare", "Hospital Supplies", "Emergency", "Frustrated"),
    ("Bio-medical waste discarded openly behind clinic in residential zone.", "Healthcare", "Mosquito Hazard", "Emergency", "Frustrated"),
    ("Food poisoning outbreak reported from unhygienic street vendor stall.", "Healthcare", "Food Safety", "Emergency", "Frustrated"),
    ("Ambulance 108 helpline not answering call during medical emergency.", "Healthcare", "Hospital Supplies", "Emergency", "Frustrated")
]

TRANSPORT_COMPLAINTS = [
    ("City bus route 45 consistently delayed by 1 hour daily during peak morning.", "Transport", "Bus Delay", "Medium", "Negative"),
    ("Traffic light malfunction at Busy Cross junction creating chaotic congestion.", "Transport", "Traffic Signal", "High", "Negative"),
    ("Bus driver driving rashly and skipped scheduled stops on Route 23.", "Transport", "Bus Delay", "Medium", "Negative"),
    ("Auto rickshaw drivers refusing by-meter fare and demanding double charges.", "Transport", "Transit Grievance", "Low", "Negative"),
    ("Bus shelter collapsed and broken glass scattered around waiting area.", "Transport", "Transit Grievance", "Medium", "Negative")
]

MUNICIPAL_COMPLAINTS = [
    ("Illegal construction and encroachment on public park land.", "Municipal Corporation", "Encroachment", "High", "Frustrated"),
    ("Property tax portal showing wrong calculation and pending dues.", "Municipal Corporation", "Property Tax", "Low", "Negative"),
    ("Birth certificate application pending for 45 days with no response from ward.", "Municipal Corporation", "Certificate Delay", "Medium", "Negative"),
    ("Trade license renewal delayed despite submitting all documents.", "Municipal Corporation", "Certificate Delay", "Low", "Neutral"),
    ("Fallen tree blocking colony inner road after gusty winds.", "Municipal Corporation", "Civic Amenities", "High", "Frustrated"),
    ("Stray dog menace in colony, pack of dogs chasing children and two-wheelers.", "Municipal Corporation", "Stray Animals", "High", "Frustrated")
]

SEED_DATA = (
    FIRE_COMPLAINTS + WATER_COMPLAINTS + ELECTRICITY_COMPLAINTS +
    SANITATION_COMPLAINTS + PUBLIC_WORKS_COMPLAINTS + POLICE_COMPLAINTS +
    HEALTH_COMPLAINTS + TRANSPORT_COMPLAINTS + MUNICIPAL_COMPLAINTS
)

PREFIXES = [
    "Urgent complaint: ", "Help needed: ", "Attention ward officer: ", "Sir/Madam, ",
    "Calling regarding ", "Filing grievance for ", "Grievance report: ", "Citizen alert: ",
    "Kindly note ", "Issue reported: ", "Complaint registered from Ward 14: "
]

SUFFIXES = [
    " Please resolve ASAP.", " Kindly look into this immediately.", " We need urgent intervention.",
    " Expecting quick response from authorities.", " Over 100 families affected in our locality."
]

def generate_augmented_dataset(target_count=800):
    rows = []
    
    for text, category, problem_type, urgency, sentiment in SEED_DATA:
        rows.append({"text": text, "category": category, "problemType": problem_type, "urgency": urgency, "sentiment": sentiment})

    while len(rows) < target_count:
        seed = random.choice(SEED_DATA)
        text, category, problem_type, urgency, sentiment = seed[0], seed[1], seed[2], seed[3], seed[4]
        new_text = f"{random.choice(PREFIXES)}{text}{random.choice(SUFFIXES)}"
        rows.append({"text": new_text, "category": category, "problemType": problem_type, "urgency": urgency, "sentiment": sentiment})

    df = pd.DataFrame(rows)
    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def main():
    os.makedirs("data", exist_ok=True)
    out_path = os.path.join("data", "complaints_train.csv")
    
    print("[Dataset] Generating citizen complaints dataset (~800 samples with category & problemType)...")
    df = generate_augmented_dataset(target_count=800)
    df.to_csv(out_path, index=False, encoding="utf-8")
    print(f"[Dataset] Saved {len(df)} labeled complaints to {out_path}")
    print("\nCategory distribution:")
    print(df['category'].value_counts())
    print("\nProblemType distribution:")
    print(df['problemType'].value_counts())

if __name__ == "__main__":
    main()
