const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// AI/call endpoints need longer timeouts — Python service cold-starts can take 45+ seconds
const AI_ENDPOINTS = ['/calls/intake', '/calls/transcribe', '/ai/', '/chat/'];
const DEFAULT_TIMEOUT_MS = 15000;
const AI_TIMEOUT_MS = 60000;

function getTimeoutMs(endpoint) {
  return AI_ENDPOINTS.some(p => endpoint.startsWith(p)) ? AI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('civicsense_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), getTimeoutMs(endpoint));

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data?.error || data?.message || `HTTP ${response.status}`, status: response.status, ...data };
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[API Timeout] ${endpoint} timed out`);
      return { success: false, error: 'The AI service is waking up from sleep mode. Please try again in 30 seconds.', timeout: true };
    }
    console.warn(`[API Error] ${endpoint}:`, err.message);
    return { success: false, error: err.message };
  }
}

export const api = {
  // Auth
  login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  citizenLogin: (phoneNumber, name, preferredLanguage) => fetchApi('/auth/citizen-login', { method: 'POST', body: JSON.stringify({ phoneNumber, name, preferredLanguage }) }),
  getMe: () => fetchApi('/auth/me'),

  // Dashboard & Analytics
  getExecutiveDashboard: () => fetchApi('/dashboard/executive'),
  getDepartmentDashboard: (id) => fetchApi(`/departments/${id}/dashboard`),
  getIncidents: () => fetchApi('/incidents'),
  getAiInsights: () => fetchApi('/insights'),
  getHeatmapData: () => fetchApi('/analytics/heatmap'),
  getSlaMetrics: () => fetchApi('/analytics/sla'),

  // Complaints & Assignments
  getComplaints: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/complaints?${query}`);
  },
  getComplaintById: (id) => fetchApi(`/complaints/${id}`),
  getSimilarResolved: (id) => fetchApi(`/complaints/${id}/similar-resolved`),
  updateComplaintLocation: (id, data) => fetchApi(`/complaints/${id}/location`, { method: 'PATCH', body: JSON.stringify(data) }),
  createComplaint: (data) => fetchApi('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaintStatus: (id, status, notes, updatedBy) => fetchApi(`/complaints/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes, updatedBy }) }),
  assignWorker: (id, workerId, assignedBy) => fetchApi(`/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify({ workerId, assignedBy }) }),

  // Workers / Field Officers
  getOfficers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/officers?${query}`);
  },
  createWorker: (data) => fetchApi('/officers', { method: 'POST', body: JSON.stringify(data) }),
  updateOfficerStatus: (id, status) => fetchApi(`/officers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Audit Action Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi(`/audit-logs?${query}`);
  },

  // Live Calls & Auditable Intake Pipeline
  getCalls: () => fetchApi('/calls'),
  intakeCall: (formData) => fetchApi('/calls/intake', { method: 'POST', body: formData }),
  transcribeAudio: (formData) => fetchApi('/calls/transcribe', { method: 'POST', body: formData }),

  // AI Microservice Services (Spam, NER, Trend Prediction)
  checkSpam: (payload) => fetchApi('/ai/check-spam', { method: 'POST', body: JSON.stringify(payload) }),
  extractEntities: (payload) => fetchApi('/ai/extract-entities', { method: 'POST', body: JSON.stringify(payload) }),
  getRecurringSignals: (days = 7) => fetchApi(`/incidents/recurring?days=${days}`),

  // Voice Complaint Upload, STT & Action Tracking
  uploadVoiceComplaint: (formData) => fetchApi('/citizen/voice-complaint', { method: 'POST', body: formData }),
  trackComplaintByNumber: (complaintNumber) => fetchApi(`/citizen/complaints/track/${complaintNumber}`),
  getComplaintStatus: (ticketId) => fetchApi(`/complaints/${ticketId}/status`),

  // Notifications
  getNotifications: () => fetchApi('/notifications'),
  markNotificationRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Departments
  getDepartments: () => fetchApi('/departments'),
  createDepartment: (data) => fetchApi('/departments', { method: 'POST', body: JSON.stringify(data) }),

  // Chatbot & Unified Dual-Mode Chat
  sendChatbotMessage: (message) => fetchApi('/chatbot/message', { method: 'POST', body: JSON.stringify({ message }) }),
  sendUnifiedChatMessage: (message, sessionId, phoneNumber) => fetchApi('/chat/message', { method: 'POST', body: JSON.stringify({ message, sessionId, phoneNumber }) }),
  chatReport: (message, sessionId, phoneNumber) => fetchApi('/chat/report', { method: 'POST', body: JSON.stringify({ message, sessionId, phoneNumber }) }),

  // Feature 11 — XAI: Explainable Classification
  explainClassification: (transcript, topN = 5) => fetchApi('/ai/explain-classification', { method: 'POST', body: JSON.stringify({ transcript, topN }) }),

  // Feature 12 — SLA Breach Risk Prediction (batch)
  getBreachRiskBatch: (complaints) => fetchApi('/ai/breach-risk-batch', { method: 'POST', body: JSON.stringify({ complaints }) }),

  // Feature 13 — Voice Reply / TTS Confirmation
  generateConfirmationAudio: (ticketId, departmentName, language = 'en') =>
    fetchApi('/ai/generate-confirmation', { method: 'POST', body: JSON.stringify({ ticketId, departmentName, language }) }),

  // Feature 14 — Photo Verification
  uploadComplaintWithPhoto: (formData) => fetchApi('/complaints', { method: 'POST', body: formData }),
  verifyPhoto: (formData) => fetchApi('/ai/verify-photo', { method: 'POST', body: formData }),
};
