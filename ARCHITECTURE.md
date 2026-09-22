# CivicSense AI — System Architecture & Technical Specification

> **AI-Powered Citizen Call Intelligence & Multi-Department Incident Management Platform**  
> *100% Local ML Stack • Zero External Paid APIs • Auditable Evidence-First Pipelines*

---

## 1. High-Level Architecture

CivicSense AI operates as a 3-tier distributed system running entirely on local infrastructure:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (React 19 + Vite)                       │
│  • Citizen Portal (Voice Recording + Tracking)                         │
│  • Live Call Center & AI Call Intelligence Queue                       │
│  • Department Virtual Call Lines & Dispatch Desk                       │
│  • Citizen AI Assistant (Q&A + Direct Chat-to-Report)                  │
│  • Executive Command Dashboard & SLA Monitoring                        │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │ REST APIs                     │ WebSocket Events
                    │                               │ (Socket.IO)
┌───────────────────▼───────────────────────────────▼────────────────────┐
│              BACKEND API GATEWAY (Node.js + Express + TS)              │
│  • Rate Limiting & Audit Evidence Pipeline                             │
│  • State Machines & Cross-Channel Identity Normalizer                  │
│  • Dynamic SLA Calculation Engine (2h / 4h / 8h / 24h / 48h)           │
│  • Socket.IO Rooms (department:*, global)                              │
│  • Prisma ORM + SQLite Database Layer                                  │
└───────────────────▲────────────────────────────────────────────────────┘
                    │ Internal HTTP
                    │ (JSON / Multipart)
┌───────────────────▼────────────────────────────────────────────────────┐
│                 AI/ML MICROSERVICE (Python Flask + Local AI)           │
│  • Faster-Whisper / OpenAI Whisper (Speech-to-Text)                    │
│  • Scikit-Learn TF-IDF + Random Forest / Logistic Regression           │
│  • HuggingFace Transformer Named Entity Recognition (NER)              │
│  • ChromaDB Vector Store (Repeat-Caller Spam Cosine Similarity)         │
│  • Haversine Geographic Distance Clustering (6.0 km radius)            │
│  • Statsmodels ARIMA / Linear Trend Recurrence Predictor               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Pipelines & Features (1 to 10)

### Feature 1: Call Intake & Audio-to-Text Storage Pipeline
- **Principle**: *Raw evidence persists before any AI classification.*
- **Endpoint**: `POST /api/calls/intake`
- **Workflow**:
  1. Multer stores `.wav` audio under `/uploads/calls/`.
  2. Phone number validated (`/^\+?[0-9]{10,15}$/`).
  3. Python Whisper STT transcribes speech, extracts duration & detected language (`ta`, `hi`, `en`).
  4. `CallRecord` written immediately to SQLite via Prisma before any classification.

### Feature 2: Repeat-Caller & Audio Spam Scoring
- **Endpoint**: `POST /api/ai/check-spam`
- **Scoring Equation**:
  $$\text{Spam Score} = (\text{Frequency Penalty}) + (\text{ChromaDB Cosine Similarity})$$
  - Frequency Penalty: If caller calls $\ge 5$ times in 24h, penalty = $0.40$.
  - Semantic Similarity: Transcripts embedded via `all-MiniLM-L6-v2`. If cosine similarity $\ge 0.85$ to a previous call from the same number, semantic score = $0.50$.
  - Flagged when $\text{Spam Score} \ge 0.60$.
- **Demo Verification Paths**:
  1. **Seeded Vector Path**: `python scripts/seed_spam_chroma.py` pre-populates ChromaDB vector history for nuisance caller `+919840499999` to prove the cosine similarity check.
  2. **Live Unseeded Simulation Path**: `python scripts/simulate_live_spam_calls.py` places 5 sequential real calls from a fresh number, demonstrating dynamic escalation from normal to spam live on demand.

### Feature 4: Cross-Channel Phone Identity Anchor
- Phone number is the universal citizen identifier across voice calls, web portal complaints, and chatbot interactions.
- `POST /api/auth/citizen-login` provides progressive registration: returns JWT token, creating/linking `Citizen` and `User` records without a password barrier.

### Feature 5: Multi-Channel Normalization
- Normalizes inputs across channels:
  - Phone formatting: `+919840011223` (removes whitespace, dashes, parens).
  - Language detection: Maps ISO codes (`ta`, `hi`, `en`) to canonical representations.
  - Priority calculation: Maps emergency terms to `CRITICAL` (2h SLA), high urgency to `HIGH` (8h SLA), standard to `MEDIUM` (24h SLA).

### Feature 6: Priority-Based SLA Deadline Calculation
- Emergency / Fire: 2 to 4 hours.
- High Priority Grievances: 8 hours.
- Standard Grievances: 24 hours.
- Low Priority: 48 hours.

### Feature 7: Citizen Phone Identity & Progressive Registration
- `POST /api/auth/citizen-login`: Allows citizens to authenticate or create accounts purely via mobile number.
- Links `reportedName` and `reportedById` directly to `Complaint` records for auditable ownership.

### Feature 8: Department Virtual Call Lines & Mismatch Detection
- Each department is assigned a direct virtual number (`1800-425-WATER`, `1800-425-ELEC`, etc.).
- Department operators join scoped WebSocket rooms `department:<id>`.
- Calls placed to a virtual line run an advisory check: if the transcript keywords mismatch the target department (e.g. fire emergency called into Water Board), `mismatchWarning: true` is tagged and broadcast.

### Feature 9: Chat-to-Report Conversational State Machine & Explicit Confirmation
- `POST /api/chat/report` implements a slot-filling state machine with human-in-the-loop confirmation:
  1. Evaluates user message for civic grievance intent.
  2. Runs TF-IDF classification and NER location extraction.
  3. If required details (phone number, location) are missing, saves `ChatSession` state (`NEED_PHONE`, `NEED_LOCATION`, `AWAITING_INFO`) and prompts the user.
  4. **Explicit Confirmation Step (`AWAITING_CONFIRMATION`)**: Once all slots are collected, the AI asks:
     `"This sounds like a [Category] issue near [Location]. Should I go ahead and file this official complaint? (Reply Yes to confirm or No to cancel)"`
  5. The complaint is **only** filed when the citizen confirms with an affirmative response ("Yes", "Sure", "Proceed", etc.), eliminating accidental tickets while remaining fully auditable and explainable.

### Feature 10: Production Hardening, Diagnostics & Audio Auth
- **Audio Authentication with Query-Param Fallback**:
  - `/uploads` files are protected by `authenticate` middleware supporting both `Authorization: Bearer <token>` and `?token=<token>` query parameters.
  - Resolves browser limitation where `<audio src="...">` and `<img>` tags cannot set custom request headers.
- **In-Memory Rate Limiting**:
  - `POST /api/calls/intake`: 10 requests / minute per IP.
  - `POST /api/chat/report`: 30 requests / minute per IP.
  - Returns `429 Too Many Requests` with `Retry-After` headers.
- **Logging & Error Handling**:
  - Request logging with method, path, status, and latency in `app.ts`.
  - Global unhandled exception handler.
- **Diagnostics & Testing**:
  - `GET /api/health` system diagnostic endpoint.
  - `scripts/reset_demo.py` one-click environment restore script.
  - `scripts/test_features_7_10.py` 5-step automated verification test suite.
  - `scripts/simulate_live_spam_calls.py` unseeded live spam simulation.

---

## 3. Database Schema Overview (Prisma)

- **Department**: `id`, `name`, `code`, `virtualNumber`, `slaHours`, `adminName`, `adminEmail`
- **User**: `id`, `name`, `email`, `role` (`SUPER_ADMIN`, `DEPT_ADMIN`, `FIELD_WORKER`, `CITIZEN`), `phone`, `departmentId`
- **Citizen**: `id`, `name`, `phone` (unique), `userId`, `preferredLanguage`, `zone`
- **Complaint**: `id`, `complaintNumber`, `category`, `subcategory`, `description`, `reportedName`, `reportedById`, `citizenId`, `priority`, `status`, `location`, `latitude`, `longitude`, `slaHours`, `slaDeadline`
- **CallRecord**: `id`, `phoneNumber`, `audioFilePath`, `durationSeconds`, `languageDetected`, `transcriptRaw`, `transcriptCleaned`, `isFlaggedSpam`, `mismatchWarning`, `departmentId`, `complaintId`
- **CallerHistory**: `id`, `phoneNumber`, `totalCalls24h`, `lastCallAt`, `spamScore`
- **ChatSession**: `id`, `phoneNumber`, `state`, `collectedData`, `complaintId`
- **AuditLog**: `id`, `action`, `entityType`, `entityId`, `details`, `actorId`, `departmentId`
