import os
import joblib
import numpy as np

class ComplaintClassifier:
    DEPARTMENT_MAP = {
        "Fire & Rescue": "Fire & Rescue",
        "Water Board": "Water Board",
        "Electricity Board": "Electricity Board",
        "Sanitation": "Sanitation",
        "Public Works": "Public Works",
        "Police": "Police",
        "Healthcare": "Healthcare",
        "Transport": "Transport",
        "Municipal Corporation": "Municipal Corporation",
        "Fire": "Fire & Rescue",
        "Water": "Water Board",
        "Electricity": "Electricity Board",
        "Health": "Healthcare",
        "Municipal": "Municipal Corporation"
    }

    def __init__(self, models_dir="models"):
        self.models_dir = models_dir
        self.vectorizer = None
        self.category_model = None
        self.problem_type_model = None
        self.urgency_model = None
        self.sentiment_model = None
        self.load_models()

    def load_models(self):
        vec_path = os.path.join(self.models_dir, "tfidf_vectorizer.joblib")
        cat_path = os.path.join(self.models_dir, "category_model.joblib")
        prob_path = os.path.join(self.models_dir, "problemType_model.joblib")
        urg_path = os.path.join(self.models_dir, "urgency_model.joblib")
        sen_path = os.path.join(self.models_dir, "sentiment_model.joblib")

        if not os.path.exists(vec_path):
            raise FileNotFoundError("Trained models not found! Run train.py first.")

        self.vectorizer = joblib.load(vec_path)
        self.category_model = joblib.load(cat_path)
        if os.path.exists(prob_path):
            self.problem_type_model = joblib.load(prob_path)
        self.urgency_model = joblib.load(urg_path)
        self.sentiment_model = joblib.load(sen_path)
        print("[ClassifierService] Successfully loaded trained scikit-learn two-level classifiers and TF-IDF vectorizer.")

    def predict(self, text: str):
        if not text or not text.strip():
            raise ValueError("Transcript text cannot be empty.")

        features = self.vectorizer.transform([text])

        # Category prediction + confidence score
        cat_pred = self.category_model.predict(features)[0]
        cat_proba = self.category_model.predict_proba(features)[0]
        cat_class_idx = np.where(self.category_model.classes_ == cat_pred)[0][0]
        confidence_score = float(cat_proba[cat_class_idx])

        # ProblemType prediction (Sub-level classifier)
        problem_type = "General Issue"
        if self.problem_type_model:
            problem_type = str(self.problem_type_model.predict(features)[0])

        urg_pred = str(self.urgency_model.predict(features)[0])
        sen_pred = str(self.sentiment_model.predict(features)[0])
        department = self.DEPARTMENT_MAP.get(cat_pred, "General Citizen Grievance Cell")

        urg_upper = urg_pred.upper()
        urgency_num = 99 if ("EMERGENCY" in urg_upper or "CRITICAL" in urg_upper) else 85 if "HIGH" in urg_upper else 35 if "LOW" in urg_upper else 60
        risk_level = "CRITICAL" if ("EMERGENCY" in urg_upper or "CRITICAL" in urg_upper or cat_pred == "Fire") else "HIGH" if "HIGH" in urg_upper else "MEDIUM"

        return {
            "category": str(cat_pred),
            "problemType": problem_type,
            "urgency": urg_pred,
            "riskLevel": risk_level,
            "urgencyScore": urgency_num,
            "sentiment": sen_pred,
            "confidenceScore": round(confidence_score, 4),
            "confidencePercentage": f"{int(round(confidence_score, 2) * 100)}%",
            "department": department,
            "recommendedAction": f"Dispatch {department} maintenance crew to inspect {problem_type} site."
        }

# Global singleton instance helper
_classifier_instance = None

def get_classifier():
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = ComplaintClassifier()
    return _classifier_instance
