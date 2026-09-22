import { Router } from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import { login, getCurrentUser, citizenLogin } from '../controllers/authController.js';
import { 
  getComplaints, 
  getComplaintById, 
  createComplaint, 
  updateComplaintStatus, 
  assignWorker,
  getSimilarResolved,
  updateComplaintLocation,
  getComplaintStatus
} from '../controllers/complaintController.js';
import { getCalls, processAudioTranscription, intake, callIntakeUpload } from '../controllers/callController.js';
import { getExecutiveDashboard } from '../controllers/dashboardController.js';
import { getIncidents, getRecurringSignals } from '../controllers/incidentController.js';
import { submitCitizenComplaint, handleVoiceComplaint, trackComplaint, upload } from '../controllers/citizenController.js';
import { processChatbotMessage, handleUnifiedChatMessage } from '../controllers/chatbotController.js';
import { handleChatReport } from '../controllers/chatReportController.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { getDepartments, getDepartmentDashboard, createDepartment } from '../controllers/departmentController.js';
import { getOfficers, createWorker, updateOfficerStatus } from '../controllers/officerController.js';
import { getAiInsights, getHeatmapData, getSlaMetrics } from '../controllers/analyticsController.js';
import { getAuditLogs } from '../controllers/auditController.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = Router();

// Rate limiters
const intakeRateLimit = rateLimit(10, 60 * 1000);    // 10 req/min per IP on intake
const chatRateLimit = rateLimit(30, 60 * 1000);       // 30 req/min per IP on chat

// Health
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'civicsense-api',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Auth
router.post('/auth/login', login);
router.get('/auth/me', getCurrentUser);

// Executive / Super Admin Dashboard
router.get('/dashboard/executive', getExecutiveDashboard);

// Department Dashboards & Management
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.get('/departments/:id/dashboard', getDepartmentDashboard);

// Complaints & Worker Assignment
router.get('/complaints', getComplaints);
router.get('/complaints/:id', getComplaintById);
router.get('/complaints/:id/similar-resolved', getSimilarResolved);
router.patch('/complaints/:id/location', updateComplaintLocation);
const complaintPhotoUpload = multer({ dest: 'uploads/photos/' });
router.post('/complaints', complaintPhotoUpload.single('photo'), createComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.get('/complaints/:ticketId/status', getComplaintStatus);
router.post('/complaints/:id/assign', assignWorker);

// Workers / Field Officers
router.get('/officers', getOfficers);
router.post('/officers', createWorker);
router.patch('/officers/:id/status', updateOfficerStatus);

// Audit Logs / Action Tracking
router.get('/audit-logs', getAuditLogs);

// Incidents & Duplicate Detection & Trend Prediction
router.get('/incidents', getIncidents);
router.get('/incidents/recurring', getRecurringSignals);

// Calls & STT Transcribe & Auditable Call Intake Pipeline
router.get('/calls', getCalls);
router.post('/calls/intake', intakeRateLimit, callIntakeUpload.single('audio'), intake);
router.post('/calls/transcribe', upload.single('audio'), processAudioTranscription);

// AI Proxies (Spam & NER)
router.post('/ai/check-spam', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const pyRes = await fetch(`${pythonUrl}/api/ai/check-spam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message });
  }
});

router.post('/ai/extract-entities', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const pyRes = await fetch(`${pythonUrl}/api/ai/extract-entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message });
  }
});

// Citizen & Voice Upload & Tracking
router.post('/citizen/complaints', submitCitizenComplaint);
router.post('/citizen/voice-complaint', upload.single('audio'), handleVoiceComplaint);
router.get('/citizen/complaints/track/:complaintNumber', trackComplaint);

// Chatbot (Q&A knowledge base & dual-mode Intent Gate)
router.post('/chatbot/message', processChatbotMessage);
router.post('/chat/message', chatRateLimit, handleUnifiedChatMessage);

// Chat-to-Report (Feature 9 — separate from Q&A chatbot, files actual Complaints)
router.post('/chat/report', chatRateLimit, handleChatReport);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Analytics, AI Insights & Heatmap
router.get('/insights', getAiInsights);
router.get('/analytics/heatmap', getHeatmapData);
router.get('/analytics/sla', getSlaMetrics);

// Feature 11 — XAI: Explain Classification
router.post('/ai/explain-classification', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const pyRes = await fetch(`${pythonUrl}/api/ai/explain-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message });
  }
});

// Feature 12 — SLA Breach Risk (batch)
router.post('/ai/breach-risk-batch', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const pyRes = await fetch(`${pythonUrl}/api/ai/breach-risk-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message });
  }
});

// Feature 13 — Voice Reply / TTS Confirmation
router.post('/ai/generate-confirmation', async (req, res) => {
  try {
    const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
    const pyRes = await fetch(`${pythonUrl}/api/ai/generate-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await pyRes.json();
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ success: false, error: err.message });
  }
});

// Auth — Citizen phone-based progressive login (Feature 7)
router.post('/auth/citizen-login', citizenLogin);

// Feature 14 — Photo Verification proxy (multipart → Python ML)
const photoUpload = multer({ dest: 'uploads/tmp/' });
router.post('/ai/verify-photo', photoUpload.single('image'), async (req: any, res) => {
  const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }
    const form = new FormData();
    form.append('image', createReadStream(req.file.path), {
      filename: req.file.originalname || 'photo.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });
    form.append('claimedCategory', req.body?.claimedCategory || 'General');

    const pyRes = await fetch(`${pythonUrl}/api/ai/verify-photo`, {
      method: 'POST',
      body: form as any,
      headers: form.getHeaders()
    });
    const data = await pyRes.json();
    // Clean up temp file
    await unlink(req.file.path).catch(() => {});
    return res.status(pyRes.status).json(data);
  } catch (err: any) {
    if (req.file) await unlink(req.file.path).catch(() => {});
    return res.status(502).json({ success: false, error: err.message });
  }
});

// Feature 13 — Proxy TTS confirmation audio files from Python Flask
router.get('/confirmations/:filename', async (req, res) => {
  const pythonUrl = process.env.PYTHON_AI_URL || 'http://localhost:5000';
  const { filename } = req.params;
  if (!/^[\w\-.]+\.wav$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  try {
    const pyRes = await fetch(`${pythonUrl}/confirmations/${filename}`);
    if (!pyRes.ok) return res.status(pyRes.status).send('Audio not found');
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-cache');
    const arrayBuffer = await pyRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    return res.status(502).json({ error: err.message });
  }
});

export default router;
