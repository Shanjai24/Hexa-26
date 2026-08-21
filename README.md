<div align="center">

# 🏛️ CivicSense AI
### AI-Powered Citizen Call Intelligence & Multi-Department Response Platform

[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_+_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/AI_Engine-Python_3.10_+_Flask-3776AB?logo=python&logoColor=white)](https://python.org/)
[![Whisper STT](https://img.shields.io/badge/Speech_to_Text-OpenAI_Whisper-412991?logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![Scikit-Learn](https://img.shields.io/badge/Machine_Learning-Scikit--Learn-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma_SQLite-2D3748?logo=prisma&logoColor=white)](https://prisma.io/)

<p align="center">
  <strong>An enterprise-grade government operations platform that captures and analyzes incoming citizen calls in real time, automatically classifies grievances, detects emergencies and duplicate outbreaks, recommends departments, tracks SLA resolution lifecycle, and provides predictive governance insights.</strong>
</p>

[Key Features](#-key-features) •
[System Architecture](#-system-architecture) •
[Quick Start](#-quick-start) •
[Demo Credentials](#-demo-personas--credentials) •
[API Reference](#-api-endpoints)

---

</div>

## 📌 Problem Statement & Overview

Government organizations receive thousands of citizen calls daily through helplines, municipal offices, electricity boards, water departments, transport authorities, and disaster management cells. Manual call handling causes bottlenecks, lost tickets, redundant worker dispatches, and lack of accountability.

**CivicSense AI** transforms incoming voice streams into structured, actionable intelligence:
- **Speech-to-Text Transcriptions** for English, Tamil, and Hindi.
- **Automated NLP Triage & Multi-Department Routing** (Water, Electricity, Fire, Health, Sanitation, etc.).
- **Duplicate Cluster Detection**: Groups multiple calls in the same geographic grid to prevent redundant dispatches.
- **Real-Time Lifecycle Tracking**: Live updates with assigned field worker names, phone numbers, and SLA timers.
- **Department Officer Audio Dispatch**: Officers can listen to caller recordings and record spoken voice memos for field workers.

---

## ✨ Key Features

### 1. 📞 Live Helpline Telephony & Call Streaming
- **Real-Time Inbound Call Monitor**: Visual 16kHz audio waveform stream with Play/Pause controls.
- **Interactive Call Simulator**: Test incoming phone calls in real time (`CALL-10452`, `CALL-10455`).
- **Bilingual Transcript Toggle**: Switch seamlessly between **Original Spoken Language** (Tamil, Hindi, English) and **AI English Translation**.
- **1-Click Call-to-Complaint Dispatch**: Converts voice calls directly into departmental tickets.

### 2. 🧠 Machine Learning Classification & Urgency Engine
- **TF-IDF + Random Forest Classifier**: High-precision classification into 6+ government departments.
- **Urgency Scoring (0–100)**: Detects high-voltage sparks, pipeline bursts, toxic smoke, and fires.
- **Department-Scoped Emergency Alerts**: Urgency scores $\ge 80$ automatically trigger critical alerts for the specific department admin.

### 3. 👥 Duplicate Report Clustering & Emerging Spike Alerts
- **Cosine Similarity NLP**: Identifies when multiple citizens report the same issue in the same neighborhood.
- **Single Master Ticket Representation**: Replaces repetitive rows with a single master ticket featuring a pulsing **`[🔥 4 Reports in Area]`** badge directly above the Ticket ID.
- **Incident Cluster Inspector**: View all grouped citizen calls under master incidents (e.g. `INC-104`).

### 4. 🏛️ Dedicated Department Command Centers
- **Domain-Specific Dashboards**: Custom interfaces for **Water Supply**, **Electricity**, **Fire & Rescue**, **Healthcare**, and **Sanitation**.
- **Role Lockout**: Department admins are strictly locked to their domain without cross-department pollution.
- **Caller Audio Player**: Officers can listen to the citizen's original voice recording directly before dispatching staff.
- **Officer Voice Dispatch Memo**: Record spoken audio instructions attached to the worker dispatch package.

### 5. 🙋 Citizen Self-Service Portal & Action Tracker
- **Bilingual Voice Intake**: Speak or upload audio to generate complaints without manually picking a department.
- **Live Ticket Tracker**: Track tickets (`CMP-10452`) with real-time progression timelines and assigned field worker details (**Name, Role, Phone Number**).
- **Grievance History**: View all submitted complaints with status tags and resolution confirmations.

### 6. 🤖 24/7 AI Helpline Assistant & Notifications
- **Conversational Chatbot**: Bilingual AI Assistant answering civic queries and tracking tickets in real time.
- **Real-Time Notification Center**: WebSocket push alerts when workers are assigned or complaint status changes.

### 7. 🗺️ Geospatial GIS Heatmap & SLA Analytics
- **Spatial Incident Heatmap**: Visualizes complaint density, active clusters, and hotspot zones across city districts.
- **SLA Breach Countdown**: Live countdown timers preventing deadline violations.
- **Predictive AI Insights**: Forecasting recurring infrastructure breakdowns.

---

## 🏗️ System Architecture

```
                                 ┌─────────────────────────────────┐
                                 │   Citizen Voice / Phone Call    │
                                 └────────────────┬────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │   Python AI Microservice (Port 5000)             │
                        │   • OpenAI Whisper STT (Tamil / Hindi / English) │
                        │   • Scikit-Learn TF-IDF + Random Forest Models   │
                        │   • Cosine Similarity Duplicate Clustering Engine│
                        └─────────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │   Node.js / Express Backend (Port 3000/4000)     │
                        │   • REST API Controllers & JWT Authentication    │
                        │   • Prisma ORM (SQLite / PostgreSQL)             │
                        │   • Socket.IO Real-Time Event Stream             │
                        └─────────────────────────┬────────────────────────┘
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │   React 19 + Vite Frontend (Port 5173)           │
                        │   • Department Admin Command Centers             │
                        │   • Live Telephony Call Center Console           │
                        │   • Citizen Public Voice & Action Tracking Portal│
                        │   • GIS Spatial Heatmap & SLA Monitoring         │
                        └──────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client |
| **Backend API** | Node.js, Express, TypeScript, Prisma ORM, JWT, Multer, Socket.IO |
| **AI / ML Microservice** | Python 3.10+, Flask, OpenAI Whisper STT, Scikit-Learn, NumPy, NLTK |
| **Database** | SQLite (Development) / PostgreSQL (Production) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.9 or higher)
- `npm` and `pip`

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/civicsense-ai.git
cd civicsense-ai
```

### 2. Start All Services (1-Command Platform Launcher)
The root `start_platform.py` script automatically manages dependencies, environment variables, database migrations, and launches the Python AI service, Node.js backend, and Vite frontend concurrently:

```bash
python start_platform.py
```

### 3. Access in Browser
- **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
- **Backend Express API**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **Python AI Microservice**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Demo Personas & Credentials

Use the **1-Click Quick Demo Login** buttons on the login screen or enter credentials manually:

| Persona | Email / Username | Password | Role & Department |
|---|---|---|---|
| 💧 **Water Board Admin** | `water.admin@civicsense.gov.in` | `admin123` | Water Supply & Drainage Command |
| ⚡ **Electricity Admin** | `elec.admin@civicsense.gov.in` | `admin123` | Power Distribution & Substation Ops |
| 🚒 **Fire & Rescue Admin** | `fire.admin@civicsense.gov.in` | `admin123` | Emergency Fire Control Cell |
| 🏥 **Healthcare Admin** | `health.admin@civicsense.gov.in` | `admin123` | Public Health & Hygiene Dept |
| 🙋 **Citizen User** | `rahul.k@gmail.com` | `citizen123` | Public Voice Grievance & Tracking |
| 🛡️ **Super Administrator** | `superadmin@civicsense.gov.in` | `admin123` | Overall City Governance Control |

---

## 📡 API Endpoints

### Citizen & Voice Ingestion
- `POST /api/citizen/voice-complaint` — Upload audio recording, transcribe via Whisper, classify via ML, and register complaint.
- `GET /api/citizen/track/:number` — Fetch end-to-end complaint lifecycle, assigned worker, phone number, and audit trail.

### Complaints & Operations
- `GET /api/complaints` — Retrieve all complaints with department and status filters.
- `POST /api/complaints` — Create a new structured complaint.
- `POST /api/complaints/:id/assign` — Dispatch a field worker and attach officer audio dispatch memo.
- `PATCH /api/complaints/:id/status` — Update resolution status (In Progress, Resolved, Closed).

### Department & Analytics
- `GET /api/departments/dashboard/:id` — Department KPI metrics, complaint queues, and worker roster.
- `GET /api/incidents` — Clustered duplicate incidents detected by semantic similarity.
- `GET /api/analytics/executive` — City-wide executive dashboard metrics and SLA compliance.

---

## 📂 Project Structure

```
civicsense-ai/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/         # Topbar, Sidebar, FloatingChatbot, Badges
│   │   ├── views/              # CitizenPortal, DepartmentDashboard, LiveCallCenter, etc.
│   │   ├── data/               # Mock data & fallback demo fixtures
│   │   └── services/           # REST API & Socket client interfaces
│   └── package.json
├── server/                     # Node.js + TypeScript Backend
│   ├── src/
│   │   ├── controllers/        # Citizen, Complaint, Department, Incident controllers
│   │   ├── integrations/       # Whisper STT & Scikit-Learn AI connectors
│   │   ├── routes/             # Express API route declarations
│   │   └── index.ts            # Server entrypoint & WebSocket handler
│   ├── prisma/                 # Prisma schema & SQLite database migrations
│   └── package.json
├── services/                   # Python AI & Machine Learning Microservice
│   ├── app.py                  # Flask REST API for STT & Classification
│   ├── train.py                # Model training pipeline for complaint routing
│   └── requirements.txt        # Python dependencies (whisper, scikit-learn, etc.)
├── start_platform.py           # Unified multi-process launcher script
├── .gitignore                  # Production-grade Git ignore configuration
├── .env.example                # Sanitized environment variable template
└── README.md                   # Project documentation
```

---

## 🔒 Security & Privacy

- **Zero Hardcoded Secrets**: All tokens, keys, and connection strings are isolated in `.env` files.
- **Git Safety**: `.gitignore` strictly protects `.env`, local SQLite database files (`dev.db`), model weights, and build directories.
- **Data Privacy**: Citizen phone numbers are formatted securely with role-based access control.

---

<div align="center">
  <sub>CivicSense AI • Developed for Advanced Citizen Call Intelligence & Data-Driven Public Governance</sub>
</div>
