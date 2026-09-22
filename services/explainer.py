"""
Feature 11 — Explainable-AI: "Why did the AI decide this?"
Uses TF-IDF × Logistic Regression coefficient attribution.
No new models needed — reuses existing trained .joblib files.
"""
import numpy as np


def _extract_contributions(transcript: str, vectorizer, model, top_n: int = 5) -> dict:
    """
    For a given transcript, vectorizer, and logistic regression model,
    compute which terms in the transcript most drove the predicted class.

    Returns { predicted, topTerms: [{ term, weight }] }
    """
    if not transcript or not transcript.strip():
        return {"predicted": "Unknown", "topTerms": [], "lowConfidence": True}

    try:
        vec = vectorizer.transform([transcript])
        feature_names = vectorizer.get_feature_names_out()

        predicted_label = model.predict(vec)[0]
        predicted_class_idx = list(model.classes_).index(predicted_label)
        coefs = model.coef_[predicted_class_idx]

        nonzero_idx = vec.nonzero()[1]
        contributions = []
        for i in nonzero_idx:
            weight = float(vec[0, i] * coefs[i])
            if weight != 0:
                contributions.append((str(feature_names[i]), weight))

        contributions.sort(key=lambda x: abs(x[1]), reverse=True)

        top_terms = [
            {"term": term, "weight": round(weight, 4)}
            for term, weight in contributions[:top_n]
        ]

        low_confidence = len(top_terms) == 0 or (
            len(top_terms) > 0 and max(abs(t["weight"]) for t in top_terms) < 0.05
        )

        return {
            "predicted": str(predicted_label),
            "topTerms": top_terms,
            "lowConfidence": low_confidence
        }
    except Exception as e:
        return {"predicted": "Unknown", "topTerms": [], "lowConfidence": True, "error": str(e)}


def explain_classification(transcript: str, vectorizer, category_model, urgency_model, top_n: int = 5) -> dict:
    """
    Produce an explanation for both category and urgency predictions.

    Returns:
    {
      category: { predicted: "Water Board", topTerms: [{ term, weight }], lowConfidence: bool },
      urgency:  { predicted: "High",        topTerms: [{ term, weight }], lowConfidence: bool }
    }
    """
    category_result = _extract_contributions(transcript, vectorizer, category_model, top_n)
    urgency_result = _extract_contributions(transcript, vectorizer, urgency_model, top_n)

    return {
        "category": category_result,
        "urgency": urgency_result
    }
