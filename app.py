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
from services.spam_detector import get_spam_detector
from services.ner_extractor import extract_location
from services.rag_resolution_assist import get_rag_resolution_assist
from services.recurrence_predictor import compute_recurrence_signals
from services.explainer import explain_classification          # Feature 11
from services.breach_predictor import get_breach_model, predict_breach_risk, train_breach_model  # Feature 12
from services.voice_reply import generate_confirmation_audio, get_audio_url  # Feature 13
from services.photo_verifier import verify_photo, get_photo_verifier  # Feature 14

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for React frontend & Node backend

# Initialize lightweight local services (fast startup, low RAM)
try:
    classifier = get_classifier()
except Exception as e:
    print(f"[App Init Warning] Classifier startup: {e}")
    classifier = None

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

try:
    breach_model = get_breach_model()  # Feature 12
except Exception as e:
    print(f"[App Init Warning] BreachPredictor startup: {e}")
    breach_model = None

# Heavy models are lazy-loaded on-demand to stay within 512MB memory limit
duplicate_detector = None
transcriber = None
spam_detector = None
rag_assist = None


def get_transcriber_safe():
    global transcriber
    if transcriber is None:
        try:
            transcriber = get_local_whisper()
        except Exception as e:
            print(f"[Lazy Load Error] LocalWhisper: {e}")
    return transcriber


def get_spam_detector_safe():
    global spam_detector
    if spam_detector is None:
        try:
            spam_detector = get_spam_detector()
        except Exception as e:
            print(f"[Lazy Load Error] SpamDetector: {e}")
    return spam_detector


def get_rag_assist_safe():
    global rag_assist
    if rag_assist is None:
        try:
            rag_assist = get_rag_resolution_assist()
        except Exception as e:
            print(f"[Lazy Load Error] RAGResolutionAssist: {e}")
    return rag_assist


def get_duplicate_detector_safe():
    global duplicate_detector
    if duplicate_detector is None:
        try:
            duplicate_detector = get_duplicate_detector()
        except Exception as e:
            print(f"[Lazy Load Error] DuplicateDetector: {e}")
    return duplicate_detector


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint confirming service status."""
    return jsonify({
        "status": "online",
        "service": "Citizen Call Intelligence Platform AI/ML Microservice (100% Local)",
        "version": "2.0.0",
        "components": {
            "classifier_trained": classifier is not None and getattr(classifier, "vectorizer", None) is not None,
            "duplicate_detector": duplicate_detector is not None or "lazy_ready",
            "local_whisper": transcriber is not None or "lazy_ready",
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
@app.route("/api/transcribe", methods=["POST"])
def transcribe_audio():
    """
    POST /transcribe or POST /api/transcribe
    Local Speech-to-Text transcription via local Whisper on CPU.
    Accepts:
      - Multipart: 'audio' or 'file'
      - JSON: { audioFilePath } (saves re-uploading bytes from backend)
      - JSON: { transcript } (direct text pass-through)
    """
    try:
        t_inst = get_transcriber_safe()
        if 'audio' in request.files:
            file_obj = request.files['audio']
            if not t_inst:
                return jsonify({"error": "Transcriber service currently unavailable"}), 503
            result = t_inst.transcribe(file_obj)
            return jsonify(result), 200
        elif 'file' in request.files:
            file_obj = request.files['file']
            if not t_inst:
                return jsonify({"error": "Transcriber service currently unavailable"}), 503
            result = t_inst.transcribe(file_obj)
            return jsonify(result), 200
        
        data = request.get_json(silent=True) or {}
        if "audioFilePath" in data and data["audioFilePath"]:
            path = data["audioFilePath"]
            if os.path.exists(path):
                if not t_inst:
                    return jsonify({"error": "Transcriber service currently unavailable"}), 503
                result = t_inst.transcribe(path)
                return jsonify(result), 200
            else:
                return jsonify({"error": f"Audio file path '{path}' not found on server."}), 404

        if "transcript" in data:
            t = data["transcript"]
            from services.local_whisper import clean_transcript
            return jsonify({
                "transcript": t,
                "transcriptCleaned": clean_transcript(t),
                "language": data.get("language", "en"),
                "durationSeconds": int(data.get("durationSeconds", 15)),
                "status": "passed_through",
                "needsManualReview": len(t.strip()) == 0
            }), 200
        
        return jsonify({"error": "No audio file uploaded, no 'audioFilePath', and no 'transcript' provided."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/check-spam", methods=["POST"])
@app.route("/api/ai/check-spam", methods=["POST"])
def check_spam():
    """
    POST /check-spam or POST /api/ai/check-spam
    Body: { phoneNumber, transcript, callRecordId, totalCalls24h }
    Evaluates repeat caller frequency and ChromaDB cosine similarity to prior calls from the same number.
    """
    try:
        data = request.get_json() or {}
        phone_number = data.get("phoneNumber", "")
        transcript = data.get("transcript", "")
        call_record_id = data.get("callRecordId")
        total_calls_24h = int(data.get("totalCalls24h", 1))

        sd = get_spam_detector_safe()
        if not sd:
            return jsonify({"isFlaggedSpam": False, "spamScore": 0.0, "reason": "Spam detector unavailable"}), 200

        result = sd.check_spam(phone_number, transcript, call_record_id, total_calls_24h)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/extract-entities", methods=["POST"])
@app.route("/api/ai/extract-entities", methods=["POST"])
def extract_entities():
    """
    POST /extract-entities or POST /api/ai/extract-entities
    Body: { transcript, language }
    Returns: { landmark, street, confidence }
    """
    try:
        data = request.get_json() or {}
        transcript = data.get("transcript", "")
        language = data.get("language", "en")

        result = extract_location(transcript, language)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/similar-resolved", methods=["POST"])
@app.route("/api/ai/similar-resolved", methods=["POST"])
def similar_resolved():
    """
    POST /similar-resolved or POST /api/ai/similar-resolved
    Body: { transcript, category, topK }
    Returns: { matches: [{ complaintId, similarity, resolutionNotes, timeToResolveHours, assignedRole, category }] }
    """
    try:
        data = request.get_json() or {}
        transcript = data.get("transcript", "")
        category = data.get("category")
        top_k = int(data.get("topK", 3))

        ra = get_rag_assist_safe()
        if not ra:
            return jsonify({"matches": []}), 200

        matches = ra.get_similar_resolved(transcript, top_k=top_k, category=category)
        return jsonify({"matches": matches}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/sync-resolved", methods=["POST"])
@app.route("/api/ai/sync-resolved", methods=["POST"])
def sync_resolved():
    """
    POST /sync-resolved or POST /api/ai/sync-resolved
    Body: { complaintId, transcript, resolutionNotes, timeToResolveHours, officerRole, category }
    Upserts a resolved complaint into ChromaDB.
    """
    try:
        data = request.get_json() or {}
        complaint_id = data.get("complaintId")
        transcript = data.get("transcript", "")
        resolution_notes = data.get("resolutionNotes", "")
        time_to_resolve_hours = float(data.get("timeToResolveHours", 4.0))
        officer_role = data.get("officerRole", "Field Engineer")
        category = data.get("category", "General")

        ra = get_rag_assist_safe()
        if not ra:
            return jsonify({"status": "error", "message": "RAG assist unavailable"}), 500

        res = ra.sync_resolved_case(
            complaint_id, transcript, resolution_notes, time_to_resolve_hours, officer_role, category
        )
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/recurrence-signals", methods=["POST"])
@app.route("/api/ai/recurrence-signals", methods=["POST"])
def recurrence_signals():
    """
    POST /recurrence-signals or POST /api/ai/recurrence-signals
    Body: { complaints: [...] }
    Returns: { signals: [{ category, geoCellLat, geoCellLng, count, trailingAvg, trendFlag, ... }] }
    """
    try:
        data = request.get_json() or {}
        complaints = data.get("complaints", [])
        signals = compute_recurrence_signals(complaints)
        return jsonify({"signals": signals}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# ──────────────────────────────────────────────────────────────────────────────
# Feature 11 — Explainable-AI Classification
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/explain-classification", methods=["POST"])
@app.route("/api/ai/explain-classification", methods=["POST"])
def explain_classification_route():
    """
    POST /api/ai/explain-classification
    Body: { transcript: string, topN?: int }
    Returns:
    {
      category: { predicted, topTerms: [{ term, weight }], lowConfidence },
      urgency:  { predicted, topTerms: [{ term, weight }], lowConfidence }
    }
    """
    try:
        data = request.get_json() or {}
        transcript = data.get("transcript", "")
        top_n = int(data.get("topN", 5))

        if not classifier:
            return jsonify({"error": "Classifier unavailable"}), 503

        result = explain_classification(
            transcript,
            classifier.vectorizer,
            classifier.category_model,
            classifier.urgency_model,
            top_n=top_n
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# Feature 12 — SLA Breach Risk Prediction
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/breach-risk", methods=["POST"])
@app.route("/api/ai/breach-risk", methods=["POST"])
def breach_risk_single():
    """
    POST /api/ai/breach-risk
    Body: { complaint: { urgencyScore, departmentBreachRate, officerWorkload,
                         createdAt, priority, hasBeenReassigned } }
    Returns: { breachRiskScore, atRisk, factors, hoursRemaining }
    """
    try:
        data = request.get_json() or {}
        complaint = data.get("complaint", {})
        if not breach_model:
            return jsonify({"error": "Breach model unavailable"}), 503
        result = predict_breach_risk(complaint, breach_model)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/breach-risk-batch", methods=["POST"])
@app.route("/api/ai/breach-risk-batch", methods=["POST"])
def breach_risk_batch():
    """
    POST /api/ai/breach-risk-batch
    Body: { complaints: [ { complaintId, ticketId, urgencyScore, ... } ] }
    Returns: { atRisk: [ { complaintId, ticketId, breachRiskScore, factors, hoursRemaining } ] }
    """
    try:
        data = request.get_json() or {}
        complaints = data.get("complaints", [])
        if not breach_model:
            return jsonify({"atRisk": []}), 200

        at_risk = []
        for c in complaints:
            result = predict_breach_risk(c, breach_model)
            if result.get("atRisk"):
                at_risk.append({
                    "complaintId": c.get("complaintId") or c.get("dbId") or c.get("id"),
                    "ticketId": c.get("ticketId") or c.get("id"),
                    "breachRiskScore": result["breachRiskScore"],
                    "factors": result["factors"],
                    "hoursRemaining": result["hoursRemaining"]
                })
        at_risk.sort(key=lambda x: x["breachRiskScore"], reverse=True)
        return jsonify({"atRisk": at_risk}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/train-breach-model", methods=["POST"])
@app.route("/api/ai/train-breach-model", methods=["POST"])
def train_breach_model_route():
    """
    POST /api/ai/train-breach-model
    Body: { resolvedComplaints: [...] }
    Retrains the breach model on the provided resolved complaint history.
    """
    global breach_model
    try:
        data = request.get_json() or {}
        resolved = data.get("resolvedComplaints", [])
        meta = train_breach_model(resolved)
        from services.breach_predictor import get_breach_model as _reload
        import importlib, services.breach_predictor as _bp_module
        _bp_module._breach_model = None  # force reload
        breach_model = _reload()
        return jsonify({"status": "trained", "meta": meta}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# Feature 13 — Closed-Loop Voice Reply (Offline TTS)
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/generate-confirmation", methods=["POST"])
@app.route("/api/ai/generate-confirmation", methods=["POST"])
def generate_confirmation_route():
    """
    POST /api/ai/generate-confirmation
    Body: { ticketId, departmentName, language? }
    Returns: { audioUrl: "/confirmations/CMP-10452_abc123.wav" } or { audioUrl: null, fallback: true }
    """
    try:
        data = request.get_json() or {}
        ticket_id = data.get("ticketId", "CMP-XXXXX")
        department_name = data.get("departmentName", "your department")
        language = data.get("language", "en")

        file_path = generate_confirmation_audio(ticket_id, department_name, language)
        audio_url = get_audio_url(file_path) if file_path else None

        return jsonify({
            "audioUrl": audio_url,
            "ticketId": ticket_id,
            "departmentName": department_name,
            "fallback": audio_url is None
        }), 200
    except Exception as e:
        return jsonify({"audioUrl": None, "fallback": True, "error": str(e)}), 200


# ──────────────────────────────────────────────────────────────────────────────
# Feature 14 — Photo Verification Cross-Check
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/verify-photo", methods=["POST"])
@app.route("/api/ai/verify-photo", methods=["POST"])
def verify_photo_route():
    """
    POST /api/ai/verify-photo
    Body: multipart/form-data with 'image' (file) and 'claimedCategory' (string)
    Returns:
    {
      predictedVisualClass: str,
      confidence: float,
      topPredictions: [{ label, confidence }],
      matchesClaimedCategory: bool,
      flagForReview: bool,
      modelNote: str
    }
    """
    import tempfile
    import re

    claimed_category = request.form.get("claimedCategory") or request.args.get("claimedCategory") or "General"

    # Accept JSON payload with base64 image path (from Node backend)
    if request.is_json:
        data = request.get_json() or {}
        image_path = data.get("imagePath")
        claimed_category = data.get("claimedCategory", claimed_category)
        if image_path and os.path.exists(image_path):
            result = verify_photo(image_path, claimed_category)
            return jsonify(result), 200
        return jsonify({"error": "imagePath not found"}), 400

    # Multipart upload — save to temp file
    if "image" not in request.files:
        return jsonify({"error": "No 'image' file in request"}), 400

    file = request.files["image"]
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    allowed = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
    if ext not in allowed:
        return jsonify({"error": f"Unsupported image type: {ext}"}), 400

    try:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        result = verify_photo(tmp_path, claimed_category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        try:
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass


# Serve confirmation audio files
@app.route("/confirmations/<filename>", methods=["GET"])
def serve_confirmation_audio(filename):
    """Serve TTS-generated WAV confirmation files."""
    import re
    from flask import send_from_directory
    # Basic filename sanitization
    if not re.match(r'^[\w\-\.]+\.wav$', filename):
        return jsonify({"error": "Invalid filename"}), 400
    confirmations_dir = os.path.join(os.path.dirname(__file__), "uploads", "confirmations")
    return send_from_directory(confirmations_dir, filename)



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

        dd = get_duplicate_detector_safe()
        if not dd:
            return jsonify({
                "isDuplicate": False,
                "similarityScore": 0.0,
                "matchingComplaint": None
            }), 200

        result = dd.check_and_store(transcript, category, urgency)
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
    app.run(host="0.0.0.0", port=port, debug=False)
