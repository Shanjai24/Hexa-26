import { useState, useEffect } from 'react';
import { 
  ShieldCheck, Building2, Users, FileText, Activity, ArrowRight,
  TrendingUp, Clock, AlertTriangle, CheckCircle2, Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';

export default function SuperAdminView({ onSelectDepartmentDashboard, onNavigate }) {
  const [departments, setDepartments] = useState([]);
  const [globalKpi, setGlobalKpi] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    async function loadSuperAdminData() {
      const deptsRes = await api.getDepartments();
      if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);

      const kpiRes = await api.getExecutiveDashboard();
      if (kpiRes.success && kpiRes.data?.kpi) setGlobalKpi(kpiRes.data.kpi);

      const logsRes = await api.getAuditLogs();
      if (logsRes.success && logsRes.data) setAuditLogs(logsRes.data);
    }
    loadSuperAdminData();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Super Admin Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              OVERALL ORGANIZATION COMMAND CENTER
            </span>
            <span className="text-xs text-slate-400 font-mono">SUPER ADMIN ACCESS</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Super Administrator Control Center</h1>
          <p className="text-xs text-slate-300 mt-1">High-level oversight across all municipal departments, admins, workers, and citizens.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dept-dashboard')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Open Department Dashboards</span>
          </button>
        </div>
      </div>

      {/* Global Organization KPI Summary */}
      {globalKpi && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Total Complaints</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{globalKpi.totalComplaints?.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">+12.4% vs last month</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase">Resolved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{globalKpi.resolved?.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-1">Overall resolution rate</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-bold uppercase">Active Pending Queue</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900">{globalKpi.pending?.toLocaleString()}</div>
            <div className="text-[10px] text-amber-700 font-medium mt-1">Across all departments</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-2xs">
            <div className="flex items-center justify-between text-red-700 mb-1">
              <span className="text-[11px] font-bold uppercase">SLA Breached</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700">{globalKpi.slaBreached}</div>
            <div className="text-[10px] text-red-600 font-semibold mt-1">Exceeded target timeframe</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-bold uppercase">SLA Compliance Rate</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-indigo-900">{globalKpi.slaComplianceRate}%</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Organization benchmark</div>
          </div>
        </div>
      )}

      {/* Departments Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Municipal Departments & Admins</h2>
          <span className="text-xs text-slate-500">{departments.length} active departments</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((d) => (
            <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{d.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{d.code} • SLA Target: {d.slaHours}h</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {d.slaCompliance} SLA
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department Admin:</span>
                  <span className="font-bold text-slate-900">{d.adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Field Workers Count:</span>
                  <span className="font-bold text-blue-600">{d.officerCount} Workers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Active Complaints:</span>
                  <span className="font-bold text-amber-600">{d.activeComplaints} Active</span>
                </div>
              </div>

              <button
                onClick={() => onSelectDepartmentDashboard(d.id)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Open {d.name} Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Organization Global Audit Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Organization-Wide Action Tracking & Audit Logs</h3>
          <p className="text-xs text-slate-500">System-wide audit trail of all department admin actions, worker assignments, and status updates.</p>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-slate-700 font-medium">{log.details}</p>
                <div className="flex items-center gap-4 text-[10px] text-slate-400">
                  <span>Actor: <strong className="text-slate-700">{log.actorName}</strong> ({log.actorRole})</span>
                  <span>Department: <strong className="text-blue-600">{log.department}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
