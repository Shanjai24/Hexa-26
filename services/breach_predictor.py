"""
Feature 12 — SLA Breach Risk Prediction
A small Logistic Regression model trained on historical resolution data.
Features: urgencyScore, departmentBreachRate, officerWorkload,
          hoursElapsed, hasBeenReassigned.
Label: 1 if resolvedAt - createdAt > SLA window, else 0.
"""
import os
import json
import joblib
import numpy as np
from datetime import datetime, timezone

MODEL_PATH = os.path.join("models", "breach_model.joblib")
META_PATH = os.path.join("models", "breach_model_meta.json")

# SLA windows (hours) by priority tier — must match schema / createComplaint logic
SLA_WINDOWS = {
    "CRITICAL": 2,
    "EMERGENCY": 2,
    "HIGH": 8,
    "MEDIUM": 24,
    "LOW": 48,
}

FEATURE_NAMES = [
    "urgencyScore",
    "departmentBreachRate",
    "officerWorkload",
    "hoursElapsed",
    "hasBeenReassigned",
]


def _priority_to_sla(priority: str) -> int:
    p = (priority or "HIGH").upper()
    return SLA_WINDOWS.get(p, 24)


def _extract_features(complaint: dict) -> list[float]:
    """Extract the 5-feature vector for a single complaint."""
    urgency_score = float(complaint.get("urgencyScore", 50) or 50)
    dept_breach_rate = float(complaint.get("departmentBreachRate", 0.2) or 0.2)
    officer_workload = float(complaint.get("officerWorkload", 2) or 2)

    # Hours elapsed since creation
    created_at = complaint.get("createdAt")
    if created_at:
        if isinstance(created_at, str):
            try:
                created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            except Exception:
                created_dt = datetime.now(timezone.utc)
        elif isinstance(created_at, datetime):
            created_dt = created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)
        else:
            created_dt = datetime.now(timezone.utc)
        now_dt = datetime.now(timezone.utc)
        hours_elapsed = (now_dt - created_dt).total_seconds() / 3600.0
    else:
        hours_elapsed = float(complaint.get("hoursElapsed", 0) or 0)

    has_reassigned = 1.0 if complaint.get("hasBeenReassigned") else 0.0

    return [urgency_score, dept_breach_rate, officer_workload, hours_elapsed, has_reassigned]


def _explain_factors(features: list[float], model) -> list[dict]:
    """
    Use logistic regression coefficients to explain which features
    contributed most to the breach probability.
    Returns list of { factor, value, contribution } sorted by |contribution|.
    """
    try:
        coefs = model.coef_[0]  # Binary LR — single coefficient row
        factors = []
        for name, val, coef in zip(FEATURE_NAMES, features, coefs):
            contribution = float(val * coef)
            factors.append({
                "factor": name,
                "value": round(val, 3),
                "contribution": round(contribution, 4)
            })
        factors.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return factors
    except Exception:
        return [{"factor": n, "value": round(v, 3), "contribution": 0.0}
                for n, v in zip(FEATURE_NAMES, features)]


def train_breach_model(resolved_complaints: list[dict]) -> dict:
    """
    Train a logistic regression breach predictor from resolved complaint history.
    Saves the model to models/breach_model.joblib.

    Each complaint dict needs:
      urgencyScore, departmentBreachRate, officerWorkload,
      createdAt (ISO str), resolvedAt (ISO str), priority, hasBeenReassigned
    """
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.pipeline import Pipeline

    X, y = [], []
    for c in resolved_complaints:
        try:
            features = _extract_features(c)
            priority = (c.get("priority") or "HIGH").upper()
            sla_hours = _priority_to_sla(priority)

            created_str = c.get("createdAt", "")
            resolved_str = c.get("resolvedAt", "")
            if not created_str or not resolved_str:
                continue

            created_dt = datetime.fromisoformat(str(created_str).replace("Z", "+00:00"))
            resolved_dt = datetime.fromisoformat(str(resolved_str).replace("Z", "+00:00"))
            hours_taken = (resolved_dt - created_dt).total_seconds() / 3600.0

            label = 1 if hours_taken > sla_hours else 0
            X.append(features)
            y.append(label)
        except Exception:
            continue

    if len(X) < 4:
        # Not enough real data — generate synthetic augmented training set
        X, y = _generate_synthetic_training_data()

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(C=1.0, max_iter=500, class_weight="balanced"))
    ])
    model.fit(X, y)

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    meta = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(X),
        "class_distribution": {
            "not_breached": int(sum(1 for v in y if v == 0)),
            "breached": int(sum(1 for v in y if v == 1))
        },
        "feature_names": FEATURE_NAMES,
        "note": "Trained on seeded historical data as proof-of-concept. "
                "Production deployment would retrain continuously on real resolution outcomes."
    }
    with open(META_PATH, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"[BreachPredictor] Model trained on {len(X)} samples. Saved to {MODEL_PATH}")
    return meta


def _generate_synthetic_training_data():
    """
    Generate synthetic but realistic training data when real history is sparse.
    Rules encode domain knowledge:
     - Critical urgency + high workload + long elapsed → breach
     - Low urgency + fresh ticket + available officer → no breach
    """
    rng = np.random.default_rng(42)
    X, y = [], []

    # Not-at-risk cases: low urgency, low workload, short elapsed
    for _ in range(60):
        X.append([
            rng.uniform(20, 50),   # urgencyScore
            rng.uniform(0.05, 0.2),  # deptBreachRate
            rng.uniform(1, 3),     # officerWorkload
            rng.uniform(0, 4),     # hoursElapsed
            0.0                    # hasBeenReassigned
        ])
        y.append(0)

    # At-risk cases: high urgency, high workload, long elapsed or reassigned
    for _ in range(60):
        urgency = rng.uniform(70, 100)
        workload = rng.uniform(5, 12)
        elapsed = rng.uniform(6, 48)
        reassigned = rng.choice([0.0, 1.0])
        breach_rate = rng.uniform(0.3, 0.7)
        X.append([urgency, breach_rate, workload, elapsed, reassigned])
        y.append(1)

    # Ambiguous middle ground
    for _ in range(30):
        X.append([
            rng.uniform(45, 75),
            rng.uniform(0.15, 0.35),
            rng.uniform(2, 6),
            rng.uniform(3, 16),
            float(rng.choice([0, 1]))
        ])
        y.append(int(rng.choice([0, 1])))

    return X, y


def predict_breach_risk(complaint: dict, model) -> dict:
    """
    Predict SLA breach probability for a single active complaint.

    Returns:
    {
      breachRiskScore: float (0-1),
      atRisk: bool (>= 0.55),
      factors: [{ factor, value, contribution }],
      hoursRemaining: float,
      note: str
    }
    """
    try:
        features = _extract_features(complaint)
        features_arr = np.array([features])

        proba = model.predict_proba(features_arr)[0]
        # class 1 = breach
        try:
            breach_idx = list(model.classes_).index(1)
        except Exception:
            # Pipeline wraps the LR — get from last step
            lr_step = model.named_steps.get("lr")
            breach_idx = list(lr_step.classes_).index(1) if lr_step else 1

        breach_prob = float(proba[breach_idx])

        # SLA time remaining
        priority = (complaint.get("priority") or "HIGH").upper()
        sla_hours = _priority_to_sla(priority)
        hours_elapsed = features[3]
        hours_remaining = max(0.0, sla_hours - hours_elapsed)

        # Explain via the LR step inside the pipeline
        try:
            lr_step = model.named_steps["lr"]
            # Need to also apply the scaler to get the transformed features
            scaler_step = model.named_steps["scaler"]
            scaled_features = scaler_step.transform(features_arr)[0]
            factors = _explain_factors(list(scaled_features), lr_step)
        except Exception:
            factors = [{"factor": n, "value": round(v, 3), "contribution": 0.0}
                       for n, v in zip(FEATURE_NAMES, features)]

        return {
            "breachRiskScore": round(breach_prob, 4),
            "atRisk": breach_prob >= 0.55,
            "factors": factors,
            "hoursRemaining": round(hours_remaining, 2),
            "note": "Proof-of-concept model; retrain on real resolution outcomes in production."
        }
    except Exception as e:
        return {
            "breachRiskScore": 0.0,
            "atRisk": False,
            "factors": [],
            "hoursRemaining": 0.0,
            "error": str(e)
        }


# ── Singleton model loader ──────────────────────────────────────────────────

_breach_model = None


def get_breach_model():
    """Load (or train on first run) the breach prediction model."""
    global _breach_model
    if _breach_model is not None:
        return _breach_model

    if os.path.exists(MODEL_PATH):
        _breach_model = joblib.load(MODEL_PATH)
        print(f"[BreachPredictor] Loaded existing model from {MODEL_PATH}")
    else:
        print("[BreachPredictor] No existing model found. Training from synthetic data...")
        train_breach_model([])  # trains on synthetic data, saves model
        _breach_model = joblib.load(MODEL_PATH)

    return _breach_model
