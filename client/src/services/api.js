const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('civicsense_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.warn(`[API Sync Fallback] ${endpoint}:`, err);
    return { success: false, error: err.message };
  }
}

export const api = {
  // Auth
  login: (email, password) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
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

  // Live Calls
  getCalls: () => fetchApi('/calls'),
  transcribeAudio: (formData) => fetchApi('/calls/transcribe', { method: 'POST', body: formData }),

  // Voice Complaint Upload, STT & Action Tracking
  uploadVoiceComplaint: (formData) => fetchApi('/citizen/voice-complaint', { method: 'POST', body: formData }),
  trackComplaintByNumber: (complaintNumber) => fetchApi(`/citizen/complaints/track/${complaintNumber}`),

  // Notifications
  getNotifications: () => fetchApi('/notifications'),
  markNotificationRead: (id) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Departments
  getDepartments: () => fetchApi('/departments'),
  createDepartment: (data) => fetchApi('/departments', { method: 'POST', body: JSON.stringify(data) }),

  // Chatbot
  sendChatbotMessage: (message) => fetchApi('/chatbot/message', { method: 'POST', body: JSON.stringify({ message }) })
};
