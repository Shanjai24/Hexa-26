import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, classification_report, confusion_matrix

def train_and_evaluate():
    data_path = os.path.join("data", "complaints_train.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"{data_path} not found. Please run scripts/generate_dataset.py first.")

    print(f"[Train] Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)
    print(f"[Train] Dataset loaded with {len(df)} rows.")

    # 80/20 train/test split
    train_df, test_df = train_test_split(df, test_size=0.20, random_state=42, stratify=df['category'])

    # Fit TF-IDF Vectorizer
    vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2), stop_words='english')
    X_train = vectorizer.fit_transform(train_df['text'])
    X_test = vectorizer.transform(test_df['text'])

    targets = ['category', 'problemType', 'urgency', 'sentiment']
    models = {}
    results = {}

    os.makedirs("models", exist_ok=True)

    print("\n" + "="*60)
    print(" TRAINING TWO-LEVEL SCIKIT-LEARN CLASSIFIERS")
    print(" (Category, ProblemType, Urgency, Sentiment)")
    print("="*60)

    for target in targets:
        y_train = train_df[target]
        y_test = test_df[target]

        clf = LogisticRegression(C=2.0, max_iter=1000, random_state=42)
        clf.fit(X_train, y_train)
        models[target] = clf

        y_pred = clf.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)

        results[target] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "classes": [str(c) for c in clf.classes_]
        }

        print(f"\n--- Target: {target.upper()} ---")
        print(f"Accuracy : {acc * 100:.2f}% | F1-Score : {f1:.4f}")
        joblib.dump(clf, f"models/{target}_model.joblib")

    # Save TF-IDF vectorizer
    joblib.dump(vectorizer, "models/tfidf_vectorizer.joblib")
    print(f"\n[Train] Saved vectorizer and 4 trained models to models/ folder.")

    # Save evaluation results.json
    results_path = os.path.join("models", "results.json")
    with open(results_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Generate & Save Confusion Matrix for Category Classifier
    category_clf = models['category']
    y_test_cat = test_df['category']
    y_pred_cat = category_clf.predict(X_test)
    labels = list(category_clf.classes_)

    cm = confusion_matrix(y_test_cat, y_pred_cat, labels=labels)
    
    plt.figure(figsize=(9, 7))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.title(f"Citizen Complaint Category Classifier Confusion Matrix\n(Overall Accuracy: {results['category']['accuracy']*100:.1f}%)", fontsize=12, fontweight='bold', pad=15)
    plt.xlabel("Predicted Category", fontweight='bold')
    plt.ylabel("True Category", fontweight='bold')
    plt.tight_layout()

    cm_path = os.path.join("models", "confusion_matrix.png")
    plt.savefig(cm_path, dpi=300)
    plt.close()

    return results

if __name__ == "__main__":
    train_and_evaluate()
