import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, CheckCircle2, Clock, AlertTriangle, Flame, 
  UserPlus, ShieldAlert, ArrowUpRight, Search, Filter, RefreshCw, Activity,
  ChevronDown, History, Check, UserCheck, MessageSquare
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api.js';

export default function DepartmentDashboardView({ 
  currentUser, 
  onSelectComplaint,
  onNavigate 
}) {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(currentUser?.departmentId || 'Water Board');
  const [deptData, setDeptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints'); // 'complaints' | 'workers' | 'logs'
  const [complaintSubFilter, setComplaintSubFilter] = useState('all'); // 'all' | 'unassigned' | 'in_progress' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkerForInspection, setSelectedWorkerForInspection] = useState(null);

  // Assign Worker Modal State & Audio Call Intelligence
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaintForAssign, setSelectedComplaintForAssign] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [isPlayingCallerAudio, setIsPlayingCallerAudio] = useState(false);
  const [isRecordingOfficerMemo, setIsRecordingOfficerMemo] = useState(false);
  const [officerMemoSeconds, setOfficerMemoSeconds] = useState(0);
  const [officerMemoRecorded, setOfficerMemoRecorded] = useState(false);
  const [selectedClusterIncident, setSelectedClusterIncident] = useState(null);

  useEffect(() => {
    let timer;
    if (isRecordingOfficerMemo) {
      timer = setInterval(() => setOfficerMemoSeconds(s => s + 1), 1000);
    } else {
      setOfficerMemoSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingOfficerMemo]);

  // Add Worker Modal State
  const [addWorkerModalOpen, setAddWorkerModalOpen] = useState(false);
  const [newWorkerForm, setNewWorkerForm] = useState({
    name: '',
    email: '',
    phone: '',
    designation: 'Field Inspector',
    zone: 'Zone 4'
  });

  // Load list of departments for department admin switcher
  useEffect(() => {
    async function loadDepts() {
      const res = await api.getDepartments();
      if (res.success && res.data?.length) {
        setDepartments(res.data);
      }
    }
    loadDepts();
  }, []);

  // Sync selected department with currentUser logged in
  useEffect(() => {
    const dept = currentUser?.departmentId || currentUser?.department;
    if (dept) {
      setSelectedDeptId(dept);
    }
  }, [currentUser?.departmentId, currentUser?.department]);

  // Fetch department specific dashboard data
  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      const target = selectedDeptId || currentUser?.department || 'Water Board';
      const res = await api.getDepartmentDashboard(target);
      if (res.success && res.data) {
        setDeptData(res.data);
      }
      setLoading(false);
    }
    fetchDashboard();
  }, [selectedDeptId, currentUser]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintForAssign || !selectedWorkerId) return;

    const res = await api.assignWorker(
      selectedComplaintForAssign.id, 
      selectedWorkerId, 
      currentUser?.name || 'Department Admin'
    );

    if (res.success) {
      setAssignModalOpen(false);
      // Refresh
      const refreshRes = await api.getDepartmentDashboard(selectedDeptId || 'Water Board');
      if (refreshRes.success && refreshRes.data) setDeptData(refreshRes.data);
    }
  };

  const handleAddWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!newWorkerForm.name) return;

    const res = await api.createWorker({
      ...newWorkerForm,
      departmentId: deptData?.department?.id || selectedDeptId
    });

    if (res.success) {
      setAddWorkerModalOpen(false);
      setNewWorkerForm({ name: '', email: '', phone: '', designation: 'Field Inspector', zone: 'Zone 4' });
      // Refresh
      const refreshRes = await api.getDepartmentDashboard(selectedDeptId || 'Water Board');
      if (refreshRes.success && refreshRes.data) setDeptData(refreshRes.data);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    const res = await api.updateComplaintStatus(
      complaintId, 
      newStatus, 
      `Status changed by ${deptData?.department?.adminName || 'Department Admin'}`, 
      currentUser?.name || 'Department Admin'
    );

    if (res.success) {
      const refreshRes = await api.getDepartmentDashboard(selectedDeptId || 'Water Board');
      if (refreshRes.success && refreshRes.data) setDeptData(refreshRes.data);
    }
  };

  const filteredComplaints = (deptData?.complaints || []).filter(c => {
    const isUnassigned = c.assignedWorker === 'Unassigned' || !c.assignedWorkerId;
    const isResolved = c.status === 'Resolved' || c.status === 'Closed';

    if (complaintSubFilter === 'unassigned' && !isUnassigned) return false;
    if (complaintSubFilter === 'in_progress' && (isUnassigned || isResolved)) return false;
    if (complaintSubFilter === 'history' && !isResolved) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.id ? String(c.id).toLowerCase().includes(q) : false) ||
      (c.citizen ? String(c.citizen).toLowerCase().includes(q) : false) ||
      (c.location ? String(c.location).toLowerCase().includes(q) : false) ||
      (c.category ? String(c.category).toLowerCase().includes(q) : false) ||
      (c.description ? String(c.description).toLowerCase().includes(q) : false)
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              DEPARTMENT COMMAND CENTER
            </span>
            {deptData?.department && (
              <span className="text-xs text-slate-300 font-mono">
                {deptData.department.code} • SLA Target: {deptData.department.slaHours}h
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-blue-400" />
            <span>{deptData?.department?.name || 'Department'} Admin Dashboard</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Admin in charge: <strong className="text-white">{deptData?.department?.adminName || 'Department Admin'}</strong> ({deptData?.department?.adminEmail})
          </p>
        </div>

        {/* Department Switcher */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-semibold text-slate-300 shrink-0">Switch Dept:</label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {departments.length > 0 ? (
              departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))
            ) : (
              <>
                <option value="Water Board">Water Board</option>
                <option value="Electricity Board">Electricity Board</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Municipal Corporation">Municipal Corporation</option>
                <option value="Fire & Rescue">Fire & Rescue</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase">Total Complaints</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{deptData?.kpi?.totalComplaints || 0}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">Assigned to this department</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Pending / In Progress</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900">{deptData?.kpi?.pending || 0}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">Requires worker action</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">{deptData?.kpi?.resolved || 0}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">Successfully completed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-2xs">
          <div className="flex items-center justify-between text-red-700 mb-1">
            <span className="text-[11px] font-bold uppercase">SLA Breached</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700">{deptData?.kpi?.slaBreached || 0}</div>
          <div className="text-[10px] text-red-600 font-semibold mt-1">SLA deadline exceeded</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase">Dept Workers Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">{deptData?.kpi?.workerCount || 0}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">Active field personnel</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Department Complaints ({deptData?.complaints?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'workers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Field Workers & Staff ({deptData?.workers?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Action Tracking Log ({deptData?.actionLogs?.length || 0})</span>
          </button>
        </div>

        {activeTab === 'workers' && (
          <button
            onClick={() => setAddWorkerModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Field Worker</span>
          </button>
        )}
      </div>

      {/* TAB 1: COMPLAINTS TABLE */}
      {activeTab === 'complaints' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Sub-filter chips */}
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => setComplaintSubFilter('all')}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  complaintSubFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                All Tickets ({deptData?.complaints?.length || 0})
              </button>

              <button
                onClick={() => setComplaintSubFilter('unassigned')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  complaintSubFilter === 'unassigned'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Not Assigned ({deptData?.complaints?.filter(c => c.assignedWorker === 'Unassigned' || !c.assignedWorkerId).length || 0})</span>
              </button>

              <button
                onClick={() => setComplaintSubFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  complaintSubFilter === 'in_progress'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>In Progress ({deptData?.complaints?.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && c.assignedWorker !== 'Unassigned').length || 0})</span>
              </button>

              <button
                onClick={() => setComplaintSubFilter('history')}
                className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  complaintSubFilter === 'history'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Department History ({deptData?.complaints?.filter(c => c.status === 'Resolved' || c.status === 'Closed').length || 0})</span>
              </button>
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Filtered: {filteredComplaints.length} tickets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[1050px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Ticket ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[160px]">Citizen</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Category & Issue</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">Location</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[90px]">Priority</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">Assigned Field Worker</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[110px]">Status</th>
                  <th className="py-3.5 px-4 whitespace-nowrap min-w-[120px]">SLA Deadline</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[190px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Ticket ID Column with Red Duplicate Alert Message Icon Badge directly above blue ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.duplicateReportsCount > 1 && (
                        <div className="mb-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedClusterIncident({
                              id: c.incidentId || 'INC-CLUSTER',
                              title: `${c.location} Outbreak (${c.duplicateReportsCount} Duplicate Reports)`,
                              location: `${c.location}, ${c.zone}`,
                              similarityScore: '96% Semantic Similarity',
                              rationale: `AI detected ${c.duplicateReportsCount} citizens reporting the exact same problem in ${c.location}. Automatically deduplicated into this single master ticket.`,
                              calls: (c.groupedCalls || []).map(g => ({
                                id: g.id,
                                citizen: g.citizen,
                                phone: g.phone,
                                time: g.time || 'Recent',
                                text: g.description
                              }))
                            })}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[11px] font-black tracking-wide shadow-xs transition-all cursor-pointer animate-pulse"
                            title={`Same report mentioned ${c.duplicateReportsCount} times in ${c.location}! Click to view duplicate caller reports.`}
                          >
                            <MessageSquare className="w-3.5 h-3.5 fill-current text-white shrink-0" />
                            <span>{c.duplicateReportsCount}</span>
                          </button>
                        </div>
                      )}
                      <div className="font-mono font-black text-blue-600 text-xs whitespace-nowrap tracking-wide">{c.id}</div>
                    </td>

                    {/* Citizen Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 whitespace-nowrap">{c.citizen}</div>
                      <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{c.phone}</div>
                      {c.duplicateReportsCount > 1 && (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5">
                          + {c.duplicateReportsCount - 1} other callers in area
                        </div>
                      )}
                    </td>

                    {/* Category & Issue */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{c.category}</div>
                      <div className="text-[11px] text-slate-600 line-clamp-1 max-w-md" title={c.aiSummary || c.description}>
                        {c.aiSummary || c.description}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 whitespace-nowrap">{c.location}</div>
                      <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{c.zone}</div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={c.priority} />
                    </td>

                    {/* Assigned Worker */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className={`font-semibold ${c.assignedWorker === 'Unassigned' || !c.assignedWorkerId ? 'text-amber-600 font-bold' : 'text-slate-900'}`}>
                          {c.assignedWorker}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={c.status} />
                    </td>

                    {/* SLA Deadline */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`font-mono text-[11px] font-bold whitespace-nowrap ${
                        c.slaRemaining?.includes('Breached') ? 'text-red-600' : 'text-slate-700'
                      }`}>
                        {c.slaRemaining}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedComplaintForAssign(c);
                            setAssignModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Assign Worker
                        </button>
                        {c.status !== 'Resolved' && (
                          <button
                            onClick={() => handleStatusUpdate(c.id, 'Resolved')}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg text-[11px] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* TAB 2: FIELD WORKERS STAFF MANAGEMENT */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(deptData?.workers || []).map((w) => (
              <div key={w.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      {w.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{w.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{w.designation}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    w.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {w.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold">{w.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-semibold">{w.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zone Assignment:</span>
                    <span className="font-semibold">{w.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Tasks:</span>
                    <span className="font-bold text-blue-600">{w.activeComplaintsCount || 0} active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Completed Tasks:</span>
                    <span className="font-bold text-emerald-600">{w.completedTasksCount || 0} completed</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWorkerForInspection(w)}
                  className="w-full mt-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Inspect Tasks & History</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ACTION TRACKING LOG */}
      {activeTab === 'logs' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Action Tracking & Audit Trail</h3>
            <p className="text-xs text-slate-500">Real-time log of actions performed by {deptData?.department?.name || 'Department'} Admin and field workers.</p>
          </div>

          <div className="space-y-3">
            {(deptData?.actionLogs || []).map((log) => (
              <div key={log.id} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-700 font-medium">{log.details}</p>
                  <div className="text-[10px] text-slate-400">
                    Actor: <span className="font-semibold text-slate-600">{log.actorName}</span> ({log.actorRole})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN WORKER */}
      {assignModalOpen && selectedComplaintForAssign && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Assign Field Worker to {selectedComplaintForAssign.id}</h3>
            <p className="text-xs text-slate-500">
              Assign a worker from {deptData?.department?.name} to inspect and resolve this complaint.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Worker:</label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  required
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-semibold"
                >
                  <option value="">-- Choose Field Worker --</option>
                  {(deptData?.workers || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.designation} - {w.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIELD WORKER */}
      {addWorkerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Field Worker under {deptData?.department?.name} Admin</h3>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Worker Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vijay K"
                  value={newWorkerForm.name}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Inspector"
                  value={newWorkerForm.designation}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, designation: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone:</label>
                <select
                  value={newWorkerForm.zone}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, zone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="Zone 1">Zone 1</option>
                  <option value="Zone 2">Zone 2</option>
                  <option value="Zone 3">Zone 3</option>
                  <option value="Zone 4">Zone 4</option>
                  <option value="Zone 5">Zone 5</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number:</label>
                <input
                  type="text"
                  placeholder="+91 98400 12345"
                  value={newWorkerForm.phone}
                  onChange={(e) => setNewWorkerForm({ ...newWorkerForm, phone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddWorkerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WORKER TASK HISTORY & INSPECTION */}
      {selectedWorkerForInspection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedWorkerForInspection.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedWorkerForInspection.name}</h3>
                  <p className="text-xs text-slate-500">{selectedWorkerForInspection.designation} â€¢ {selectedWorkerForInspection.zone}</p>
                  <p className="text-xs text-slate-400">Phone: {selectedWorkerForInspection.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkerForInspection(null)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-lg cursor-pointer"
              >
                âœ•
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-900">
                <span className="text-blue-500 uppercase text-[10px] block">Active Assigned Tasks</span>
                <span className="text-xl">{selectedWorkerForInspection.activeComplaintsCount || 0}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-900">
                <span className="text-emerald-500 uppercase text-[10px] block">Completed Tasks</span>
                <span className="text-xl">{selectedWorkerForInspection.completedTasksCount || 0}</span>
              </div>
            </div>

            {/* Active Tasks List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Active Assigned Tasks ({selectedWorkerForInspection.activeTasks?.length || 0})</span>
              </h4>
              {selectedWorkerForInspection.activeTasks?.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedWorkerForInspection.activeTasks.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-blue-600 font-mono">{t.id}</span>
                        <p className="text-[11px] text-slate-700">{t.category} â€” {t.location}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">In Progress</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No active pending tasks.</p>
              )}
            </div>

            {/* Completed Tasks History List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed Tasks History ({selectedWorkerForInspection.completedTasks?.length || 0})</span>
              </h4>
              {selectedWorkerForInspection.completedTasks?.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedWorkerForInspection.completedTasks.map((t, idx) => (
                    <div key={idx} className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 font-mono">{t.id}</span>
                        <p className="text-[11px] text-slate-700">{t.category} â€” {t.location}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Completed</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No completed tasks recorded yet.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedWorkerForInspection(null)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg cursor-pointer hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: DUPLICATE REPORTS CLUSTER INSPECTOR */}
      {selectedClusterIncident && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300">
                    AI INCIDENT CLUSTER: {selectedClusterIncident.id}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedClusterIncident.similarityScore}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1">{selectedClusterIncident.title}</h3>
                <p className="text-xs text-slate-500">Location Area: <strong className="text-slate-800">{selectedClusterIncident.location}</strong></p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClusterIncident(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-amber-950">
              <strong className="text-amber-900 block mb-0.5">AI Duplicate Detection Rationale:</strong>
              <p>{selectedClusterIncident.rationale}</p>
            </div>

            {/* List of Duplicate Reports in same area */}
            <div className="space-y-2.5">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Related Citizen Calls in this Surrounding Area:
              </span>

              {selectedClusterIncident.calls?.map((call, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-blue-700">{call.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{call.time}</span>
                  </div>
                  <div className="font-bold text-slate-800">{call.citizen} ({call.phone})</div>
                  <p className="text-slate-600 italic">"{call.text}"</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClusterIncident(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedClusterIncident(null);
                  onNavigate && onNavigate('incidents');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>View in Global Incident Map</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







