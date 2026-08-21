import os
os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import local services
from services.classifier import get_classifier
from services.duplicate_detector import get_duplicate_detector
from services.local_whisper import get_local_whisper
from services.local_summarizer import get_local_summarizer
from services.geo_clusterer import get_geo_clusterer

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for React frontend & Node backend

# Initialize local services
try:
    classifier = get_classifier()
except Exception as e:
    print(f"[App Init Warning] Classifier startup: {e}")
    classifier = None

try:
    duplicate_detector = get_duplicate_detector()
except Exception as e:
    print(f"[App Init Warning] DuplicateDetector startup: {e}")
    duplicate_detector = None

try:
    transcriber = get_local_whisper()
except Exception as e:
    print(f"[App Init Warning] LocalWhisper startup: {e}")
    transcriber = None

try:
    summarizer = get_local_summarizer()
except Exception as e:
    print(f"[App Init Warning] LocalSummarizer startup: {e}")
    summarizer = None

try:
    geo_clusterer = get_geo_clusterer()
except Exception as e:
    print(f"[App Init Warning] GeoClusterer startup: {e}")
    geo_clusterer = None


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint confirming service status."""
    return jsonify({
        "status": "online",
        "service": "Citizen Call Intelligence Platform AI/ML Microservice (100% Local)",
        "version": "2.0.0",
        "components": {
            "classifier_trained": classifier is not None and classifier.vectorizer is not None,
            "duplicate_detector": duplicate_detector is not None,
            "local_whisper": transcriber is not None,
            "local_summarizer": summarizer is not None,
            "geo_clusterer": geo_clusterer is not None
        }
    }), 200


@app.route("/metrics", methods=["GET"])
def get_metrics():
    """Returns evaluation metrics from models/results.json."""
    results_path = os.path.join("models", "results.json")
    if not os.path.exists(results_path):
        return jsonify({"error": "Metrics file not found. Train the model first."}), 404
    
    with open(results_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data), 200


@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    """
    POST /transcribe
    Local Speech-to-Text transcription via local Whisper on CPU.
    """
    try:
        if 'audio' in request.files:
            file_obj = request.files['audio']
            result = transcriber.transcribe(file_obj)
            return jsonify(result), 200
        elif 'file' in request.files:
            file_obj = request.files['file']
            result = transcriber.transcribe(file_obj)
            return jsonify(result), 200
        
        data = request.get_json(silent=True) or {}
        if "transcript" in data:
            return jsonify({
                "transcript": data["transcript"],
                "language": data.get("language", "en"),
                "status": "passed_through"
            }), 200
        
        return jsonify({"error": "No audio file uploaded ('audio'/'file') and no 'transcript' JSON field provided."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict_complaint():
    """
    POST /predict
    Accepts { transcript }
    Uses TF-IDF + trained scikit-learn models (Category, Urgency, Sentiment).
    """
    try:
        data = request.get_json()
        if not data or "transcript" not in data:
            return jsonify({"error": "Missing 'transcript' field in request body."}), 400
        
        transcript = data["transcript"]
        prediction = classifier.predict(transcript)
        return jsonify(prediction), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/summarize", methods=["POST"])
def summarize_complaint():
    """
    POST /summarize
    Accepts { transcript, category, urgency }
    Calls 100% local summarizer for 2-3 line summary and reasoning.
    """
    try:
        data = request.get_json()
        if not data or "transcript" not in data:
            return jsonify({"error": "Missing 'transcript' field in request body."}), 400

        transcript = data["transcript"]
        category = data.get("category", "General")
        urgency = data.get("urgency", "Medium")

        result = summarizer.summarize(transcript, category, urgency)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/check-duplicate", methods=["POST"])
def check_duplicate_complaint():
    """
    POST /check-duplicate
    Accepts { transcript, category, urgency }
    Computes local sentence-transformer embedding, queries ChromaDB.
    """
    try:
        data = request.get_json()
        if not data or "transcript" not in data:
            return jsonify({"error": "Missing 'transcript' field in request body."}), 400

        transcript = data["transcript"]
        category = data.get("category", "Other")
        urgency = data.get("urgency", "Medium")

        result = duplicate_detector.check_and_store(transcript, category, urgency)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/geo-cluster", methods=["POST"])
def geo_cluster_complaint():
    """
    POST /geo-cluster
    Accepts { lat, lng, category, complaintId }
    Runs Haversine distance algorithm against active incident groups (radius <= 500m).
    """
    try:
        data = request.get_json() or {}
        lat = float(data.get("lat", 28.6139))
        lng = float(data.get("lng", 77.2090))
        category = data.get("category", "Municipal")
        complaint_id = data.get("complaintId")

        cluster_result = geo_clusterer.process_complaint_location(lat, lng, category, complaint_id)
        return jsonify(cluster_result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/pipeline", methods=["POST"])
def run_pipeline():
    """
    POST /pipeline
    Unified local AI pipeline:
    1. Transcribe (Local Whisper or JSON input)
    2. Predict (TF-IDF + scikit-learn models)
    3. Summarize (Local HuggingFace/NLP summarizer)
    4. Check Duplicate (Sentence-Transformers + ChromaDB)
    5. Geo-Cluster (Haversine distance <= 500m -> Incident Group)
    """
    try:
        # Step 1: Transcribe / extract text input
        transcript = None
        language = "en"
        lat = 28.6139
        lng = 77.2090
        
        if 'audio' in request.files or 'file' in request.files:
            file_obj = request.files.get('audio') or request.files.get('file')
            transcribe_res = transcriber.transcribe(file_obj)
            transcript = transcribe_res.get("transcript")
            language = transcribe_res.get("language", "en")
            # Check form data for location
            if request.form.get("lat"):
                lat = float(request.form.get("lat"))
            if request.form.get("lng"):
                lng = float(request.form.get("lng"))
        else:
            data = request.get_json(silent=True) or {}
            transcript = data.get("transcript")
            language = data.get("language", "en")
            if "lat" in data:
                lat = float(data["lat"])
            if "lng" in data:
                lng = float(data["lng"])

        if not transcript:
            return jsonify({"error": "Could not obtain transcript. Provide audio file or 'transcript' JSON field."}), 400

        # Step 2: Predict using trained scikit-learn classifiers
        prediction = classifier.predict(transcript)
        category = prediction["category"]
        urgency = prediction["urgency"]

        # Step 3: Local Summarization & Reasoning
        summary_res = summarizer.summarize(transcript, category, urgency)

        # Step 4: Duplicate Detection (ChromaDB + sentence-transformers)
        duplicate_res = duplicate_detector.check_and_store(transcript, category, urgency)

        # Step 5: Haversine Geo-Clustering
        cluster_res = geo_clusterer.process_complaint_location(lat, lng, category)

        # Combine into complete structured output
        combined = {
            "transcript": transcript,
            "detectedLanguage": language,
            "location": {"lat": lat, "lng": lng},
            "classification": prediction,
            "summary": summary_res.get("summary"),
            "reasoning": summary_res.get("reasoning"),
            "duplicateCheck": duplicate_res,
            "incidentGroup": cluster_res
        }

        return jsonify(combined), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"\n==================================================")
    print(f" Citizen Call Intelligence Microservice (100% Local)")
    print(f" Listening on http://localhost:{port}")
    print(f"==================================================\n")
    app.run(host="0.0.0.0", port=port, debug=True)
