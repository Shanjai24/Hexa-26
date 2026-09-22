import re

# Try loading spaCy model
try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    print("[NERExtractor] Loaded spaCy 'en_core_web_sm' model.")
except Exception as e:
    print(f"[NERExtractor Warning] spaCy model load fallback: {e}")
    nlp = None

# Regional / Landmark keywords list for Indian Municipalities (Tamil, Hindi, English transliterated)
LANDMARK_KEYWORDS = [
    "bus stand", "bus stop", "railway station", "metro station", "market",
    "hospital", "primary health centre", "school", "college", "temple",
    "church", "mosque", "park", "junction", "roundtana", "signal",
    "flyover", "bridge", "substation", "water tank", "community hall",
    "பேருந்து நிலையம்", "ரயில் நிலையம்", "சந்தை", "மருத்துவமனை", "பள்ளி",
    "बस स्टैंड", "रेलवे स्टेशन", "अस्पताल", "स्कूल", "बाजार"
]

STREET_SUFFIXES = [
    "street", "road", "salai", "nagar", "colony", "layout", "lane",
    "avenue", "cross", "main road", "highway", "drive", "path",
    "தெரு", "சாலை", "நகர்", "காலனி",
    "मार्ग", "सड़क", "नगर", "कॉलोनी"
]


def regex_fallback_extract(transcript: str) -> dict:
    """Rule-based and keyword extraction for regional languages (Tamil/Hindi) or spaCy fallback."""
    text = transcript.strip()
    found_landmark = None
    found_street = None

    # Check known landmark keywords
    lower_text = text.lower()
    for kw in LANDMARK_KEYWORDS:
        if kw.lower() in lower_text:
            idx = lower_text.find(kw.lower())
            # Grab surrounding words up to 4 words before and after
            start = max(0, idx - 25)
            end = min(len(text), idx + len(kw) + 25)
            snippet = text[start:end].strip()
            # Clean snippet to sensible phrase
            words = snippet.split()
            found_landmark = " ".join(words[:5]) if len(words) >= 1 else kw
            break

    # Look for street / road patterns like "Anna Nagar", "Gandhi Street", "Kamarajar Salai"
    street_pattern = re.compile(
        r'\b([A-Z][a-zA-Z\s]{2,20}\s+(?:Street|Road|Salai|Nagar|Colony|Layout|Avenue|Lane))\b',
        re.IGNORECASE
    )
    street_match = street_pattern.search(text)
    if street_match:
        found_street = street_match.group(1).strip()

    confidence = 0.75 if (found_landmark or found_street) else 0.40
    return {
        "landmark": found_landmark,
        "street": found_street,
        "confidence": round(confidence, 2),
        "source": "rule_based_regional_fallback"
    }


def extract_location(transcript: str, language: str = "en") -> dict:
    """
    Extracts landmark, street, and confidence score from complaint transcript.
    Uses spaCy GPE/FAC/LOC entities for English, with rule-based fallback for Tamil/Hindi.
    """
    if not transcript or not transcript.strip():
        return {"landmark": None, "street": None, "confidence": 0.0}

    text = transcript.strip()
    clean_lang = (language or "en").lower()

    if clean_lang != "en" and clean_lang != "english" or nlp is None:
        return regex_fallback_extract(text)

    try:
        doc = nlp(text)
        location_ents = [
            ent.text for ent in doc.ents
            if ent.label_ in ("GPE", "FAC", "LOC", "ORG")
        ]

        found_landmark = None
        found_street = None

        if location_ents:
            found_landmark = location_ents[0]

        # Extract street patterns
        street_pattern = re.compile(
            r'\b([A-Z][a-zA-Z\s]{1,25}\s+(?:Street|Road|Salai|Nagar|Colony|Layout|Avenue|Lane|Circle))\b',
            re.IGNORECASE
        )
        match = street_pattern.search(text)
        if match:
            found_street = match.group(1).strip()
            if not found_landmark:
                found_landmark = found_street

        total_ents = len(doc.ents)
        confidence = min(1.0, round(len(location_ents) / max(total_ents, 1), 2)) if location_ents else 0.50

        # If spaCy found nothing, try regex fallback
        if not found_landmark and not found_street:
            return regex_fallback_extract(text)

        return {
            "landmark": found_landmark,
            "street": found_street,
            "confidence": max(confidence, 0.70),
            "source": "spacy_en_ner"
        }
    except Exception as e:
        print(f"[NERExtractor Error] {e}")
        return regex_fallback_extract(text)


# Singleton helper
_ner_extractor_instance = None

def get_ner_extractor():
    global _ner_extractor_instance
    if _ner_extractor_instance is None:
        _ner_extractor_instance = extract_location
    return _ner_extractor_instance
