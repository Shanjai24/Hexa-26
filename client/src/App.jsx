import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import EmergencyAlertModal from './components/EmergencyAlertModal';
import FloatingChatbot from './components/FloatingChatbot';
import { api } from './services/api.js';
import { socket } from './services/socket.js';

// Views
import LoginView from './views/LoginView';
import SuperAdminView from './views/SuperAdminView';
import DepartmentDashboardView from './views/DepartmentDashboardView';
import ExecutiveDashboardView from './views/ExecutiveDashboardView';
import LiveCallCenterView from './views/LiveCallCenterView';
import LiveAiPipelineView from './views/LiveAiPipelineView';
import ComplaintManagementView from './views/ComplaintManagementView';
import ComplaintDetailsView from './views/ComplaintDetailsView';
import IncidentDetectionView from './views/IncidentDetectionView';
import HeatmapAnalyticsView from './views/HeatmapAnalyticsView';
import SlaMonitoringView from './views/SlaMonitoringView';
import OfficerDashboardView from './views/OfficerDashboardView';
import CitizenPortalView from './views/CitizenPortalView';
import CitizenChatbotView from './views/CitizenChatbotView';
import AiInsightsView from './views/AiInsightsView';
import NotificationsView from './views/NotificationsView';
import AdministrationView from './views/AdministrationView';

// Mock Data Defaults
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_INCIDENTS, 
  EXECUTIVE_KPI, 
  DEPARTMENTS_DATA, 
  LIVE_CALL_QUEUE, 
  AI_EXECUTIVE_INSIGHTS, 
  NOTIFICATIONS_DATA 
} from './data/mockData';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const [currentView, setCurrentView] = useState('super-admin');
  const [selectedDeptId, setSelectedDeptId] = useState('Water Board');
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);
  const [kpi, setKpi] = useState(EXECUTIVE_KPI);

  // Sync with Backend APIs & Sockets
  useEffect(() => {
    async function loadData() {
      const cmpRes = await api.getComplaints();
      if (cmpRes.success && cmpRes.data?.length) {
        setComplaints(cmpRes.data);
      }

      const dashRes = await api.getExecutiveDashboard();
      if (dashRes.success && dashRes.data?.kpi) {
        setKpi(dashRes.data.kpi);
      }

      const incRes = await api.getIncidents();
      if (incRes.success && incRes.data?.length) {
        setIncidents(incRes.data);
      }

      const notifRes = await api.getNotifications();
      if (notifRes.success && notifRes.data?.length) {
        setNotifications(notifRes.data);
      }
    }
    loadData();

    // Listen to real-time WebSocket events from Backend
    socket.on('complaint:created', (newCmp) => {
      setComplaints((prev) => [newCmp, ...prev]);
    });

    socket.on('complaint:updated', (updatedData) => {
      if (!updatedData?.id) return;
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === updatedData.id || c.dbId === updatedData.dbId
            ? { ...c, status: updatedData.status === 'IN_PROGRESS' ? 'In Progress' : updatedData.status === 'RESOLVED' ? 'Resolved' : updatedData.status }
            : c
        )
      );
    });

    socket.on('emergency:detected', () => {
      setIsEmergencyModalOpen(true);
    });

    return () => {
      socket.off('complaint:created');
      socket.off('complaint:updated');
      socket.off('emergency:detected');
    };
  }, []);

  const handleSetCurrentUser = (user) => {
    setCurrentUser(user);
    if (!user) { localStorage.removeItem('civicsense_token'); }
    if (user?.departmentId || user?.department) {
      setSelectedDeptId(user.departmentId || user.department);
    }
  };

  if (!currentUser) {
    return (
      <LoginView 
        onLogin={(user) => {
          handleSetCurrentUser(user);
          setCurrentView(user.view || 'super-admin');
        }} 
      />
    );
  }

  const handleSelectComplaint = (cmp) => {
    setSelectedComplaint(cmp);
    setCurrentView('complaint-details');
  };

  const handleRegisterComplaint = (newCmp) => {
    const targetDept = newCmp.department || newCmp.category || 'Water Board';
    const formattedCmp = {
      ...newCmp,
      department: targetDept,
      category: newCmp.category || targetDept
    };

    setComplaints((prev) => [formattedCmp, ...prev]);
    api.createComplaint(formattedCmp);
  };

  const handleCreateFromCall = (call) => {
    const isWater = call.aiDept?.toLowerCase().includes('water') || call.aiCategory?.toLowerCase().includes('water');
    const priorityUpper = (call.priority || 'HIGH').toUpperCase();
    const isEmergency = call.emergency || priorityUpper === 'CRITICAL' || priorityUpper === 'EMERGENCY';
    const slaHours = isEmergency ? 2 : priorityUpper === 'HIGH' ? 8 : priorityUpper === 'LOW' ? 48 : 24;

    const newCmp = {
      id: `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
      citizen: call.phone,
      phone: call.phone,
      category: call.aiCategory,
      subcategory: 'Helpline Call Ticket',
      location: call.location,
      zone: 'Zone 4',
      priority: priorityUpper,
      department: isWater ? 'Water Board' : call.aiDept,
      assignedOfficer: 'Arun Kumar',
      officerRole: 'Water Board Maintenance Lead (Zone 4)',
      status: 'Assigned',
      slaTotalHours: slaHours,
      slaRemaining: `${String(slaHours - 1).padStart(2, '0')}:59:00`,
      created: 'Just now',
      language: call.language,
      audioDuration: call.duration,
      transcript: call.rawTranscript,
      transcriptEnglish: call.englishTranscript,
      aiSummary: call.summary,
      sentiment: call.sentiment,
      urgencyScore: isEmergency ? 99 : 85,
      aiConfidence: call.aiConfidence,
      isEmergency: isEmergency,
      duplicateCount: 0,
      incidentId: null
    };
    handleRegisterComplaint(newCmp);
  };

  const handleUpdateStatus = (id, newStatus) => {
    setComplaints((prev) => 
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
    }
    api.updateComplaintStatus(id, newStatus);
  };

  const userDept = currentUser?.departmentId || currentUser?.department;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.name === 'Super Administrator';
  const isCitizen = currentUser?.role === 'CITIZEN' || currentUser?.role?.toLowerCase?.().includes('citizen') || currentUser?.view === 'citizen-portal';

  const getDeptStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.name) return String(val.name);
    return String(val);
  };

  const emergencyCount = isCitizen ? 0 : complaints.filter(c => {
    const isUnresolved = c.status !== 'Resolved' && c.status !== 'Closed';
    const isHighRisk = c.isEmergency || c.priority === 'CRITICAL' || c.priority === 'EMERGENCY' || (c.urgencyScore && c.urgencyScore >= 80);
    if (!isUnresolved || !isHighRisk) return false;

    if (!isSuperAdmin && userDept) {
      const cmpDept = getDeptStr(c.department || c.category).toLowerCase();
      const targetDept = getDeptStr(userDept).toLowerCase();
      return cmpDept.includes(targetDept) || targetDept.includes(cmpDept);
    }
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased">
      <div className="flex flex-1">
        <Sidebar
          currentView={currentView}
          setCurrentView={(v) => {
            if (v !== 'complaint-details') setSelectedComplaint(null);
            setCurrentView(v);
          }}
          currentUser={currentUser}
          setCurrentUser={handleSetCurrentUser}
          emergencyCount={emergencyCount}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            searchQuery={searchQuery}
            setSearchQuery={(q) => {
              setSearchQuery(q);
              if (q && currentView !== 'complaints') setCurrentView('complaints');
            }}
            setCurrentView={setCurrentView}
            emergencyCount={emergencyCount}
            currentUser={currentUser}
            setCurrentUser={handleSetCurrentUser}
            onTriggerEmergencyModal={() => setIsEmergencyModalOpen(false)}
          />

          <main className="flex-1 overflow-y-auto pb-12">
            {currentView === 'super-admin' && (
              <SuperAdminView
                onSelectDepartmentDashboard={(deptId) => {
                  setSelectedDeptId(deptId);
                  setCurrentView('dept-dashboard');
                }}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'dept-dashboard' && (
              <DepartmentDashboardView
                currentUser={{
                  ...currentUser,
                  departmentId: currentUser.departmentId || currentUser.department || selectedDeptId
                }}
                onSelectComplaint={handleSelectComplaint}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'executive' && (
              <ExecutiveDashboardView
                kpi={kpi}
                complaints={complaints}
                insights={AI_EXECUTIVE_INSIGHTS}
                onSelectComplaint={handleSelectComplaint}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'live-calls' && (
              <LiveCallCenterView
                queue={LIVE_CALL_QUEUE}
                onSelectCall={() => {}}
                onCreateComplaint={handleCreateFromCall}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'ai-pipeline' && (
              <LiveAiPipelineView />
            )}

            {currentView === 'complaints' && (
              <ComplaintManagementView
                complaints={complaints}
                onSelectComplaint={handleSelectComplaint}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {currentView === 'complaint-details' && (
              <ComplaintDetailsView
                complaint={selectedComplaint || complaints[0]}
                onBack={() => setCurrentView('complaints')}
                onNavigate={setCurrentView}
                onUpdateStatus={handleUpdateStatus}
              />
            )}

            {currentView === 'incidents' && (
              <IncidentDetectionView
                incidents={incidents}
                onSelectComplaint={handleSelectComplaint}
              />
            )}

            {currentView === 'heatmap' && (
              <HeatmapAnalyticsView />
            )}

            {currentView === 'sla' && (
              <SlaMonitoringView
                complaints={complaints}
                departments={DEPARTMENTS_DATA}
              />
            )}

            {currentView === 'officer' && (
              <OfficerDashboardView
                complaints={complaints}
                onSelectComplaint={handleSelectComplaint}
              />
            )}

            {currentView === 'citizen-portal' && (
              <CitizenPortalView
                currentUser={currentUser}
                onNavigate={setCurrentView}
                onRegisterComplaint={handleRegisterComplaint}
              />
            )}

            {currentView === 'citizen-chatbot' && (
              <CitizenChatbotView />
            )}

            {currentView === 'ai-insights' && (
              <AiInsightsView />
            )}

            {currentView === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                onNavigate={setCurrentView}
              />
            )}

            {(currentView === 'administration' || currentView === 'admin-depts' || currentView === 'admin-users' || currentView === 'admin-settings') && (
              <AdministrationView
                departments={DEPARTMENTS_DATA}
              />
            )}
          </main>
        </div>
      </div>

      <EmergencyAlertModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        onDispatch={() => {
          handleUpdateStatus('CMP-10455', 'Dispatched');
          setCurrentView('live-calls');
        }}
      />

      {/* Floating Citizen AI Chatbot (Bottom Right - Hidden on Fullscreen Chat View) */}
      {currentView !== 'citizen-chatbot' && <FloatingChatbot />}
    </div>
  );
}
