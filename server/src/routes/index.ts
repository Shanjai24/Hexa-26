import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { getComplaints, getComplaintById, createComplaint, updateComplaintStatus, assignWorker } from '../controllers/complaintController.js';
import { getCalls, processAudioTranscription } from '../controllers/callController.js';
import { getExecutiveDashboard } from '../controllers/dashboardController.js';
import { getIncidents } from '../controllers/incidentController.js';
import { submitCitizenComplaint, handleVoiceComplaint, trackComplaint, upload } from '../controllers/citizenController.js';
import { processChatbotMessage } from '../controllers/chatbotController.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';
import { getDepartments, getDepartmentDashboard, createDepartment } from '../controllers/departmentController.js';
import { getOfficers, createWorker, updateOfficerStatus } from '../controllers/officerController.js';
import { getAiInsights, getHeatmapData, getSlaMetrics } from '../controllers/analyticsController.js';
import { getAuditLogs } from '../controllers/auditController.js';

const router = Router();

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
router.post('/complaints', createComplaint);
router.patch('/complaints/:id/status', updateComplaintStatus);
router.post('/complaints/:id/assign', assignWorker);

// Workers / Field Officers
router.get('/officers', getOfficers);
router.post('/officers', createWorker);
router.patch('/officers/:id/status', updateOfficerStatus);

// Audit Logs / Action Tracking
router.get('/audit-logs', getAuditLogs);

// Incidents & Duplicate Detection
router.get('/incidents', getIncidents);

// Calls & STT Transcribe
router.get('/calls', getCalls);
router.post('/calls/transcribe', upload.single('audio'), processAudioTranscription);

// Citizen & Voice Upload & Tracking
router.post('/citizen/complaints', submitCitizenComplaint);
router.post('/citizen/voice-complaint', upload.single('audio'), handleVoiceComplaint);
router.get('/citizen/complaints/track/:complaintNumber', trackComplaint);

// Chatbot
router.post('/chatbot/message', processChatbotMessage);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// Analytics, AI Insights & Heatmap
router.get('/insights', getAiInsights);
router.get('/analytics/heatmap', getHeatmapData);
router.get('/analytics/sla', getSlaMetrics);

export default router;
