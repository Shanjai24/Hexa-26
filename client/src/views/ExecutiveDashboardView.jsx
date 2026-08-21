import React from 'react';
import { 
  FileText, CheckCircle2, Clock, AlertTriangle, Flame, TrendingUp, Sparkles, ArrowUpRight, 
  MapPin, ShieldAlert, ArrowRight, Activity
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function ExecutiveDashboardView({ 
  kpi, 
  complaints, 
  insights, 
  onSelectComplaint, 
  onNavigate 
}) {
  const trendData = [
    { day: 'Jul 16', complaints: 320, resolved: 290 },
    { day: 'Jul 20', complaints: 380, resolved: 340 },
    { day: 'Jul 24', complaints: 410, resolved: 360 },
    { day: 'Jul 28', complaints: 490, resolved: 410 },
    { day: 'Aug 01', complaints: 520, resolved: 440 },
    { day: 'Aug 05', complaints: 460, resolved: 430 },
    { day: 'Aug 09', complaints: 580, resolved: 480 },
    { day: 'Aug 14', complaints: 640, resolved: 530 }
  ];

  const deptData = [
    { name: 'Water', count: 1284, color: '#2563eb' },
    { name: 'Electricity', count: 1105, color: '#f59e0b' },
    { name: 'Roads', count: 1424, color: '#64748b' },
    { name: 'Healthcare', count: 640, color: '#10b981' },
    { name: 'Sanitation', count: 3120, color: '#8b5cf6' },
    { name: 'Transport', count: 780, color: '#06b6d4' },
    { name: 'Police', count: 890, color: '#3b82f6' }
  ];

  const categoryData = [
    { name: 'Water Supply', value: 32 },
    { name: 'Garbage Dump', value: 25 },
    { name: 'Road Defect', value: 18 },
    { name: 'Power Failure', value: 15 },
    { name: 'Street Lights', value: 10 }
  ];
  const COLORS = ['#2563eb', '#8b5cf6', '#64748b', '#f59e0b', '#10b981'];

  const deptProgress = [
    { name: 'Sanitation Dept', rate: 94, total: 3120 },
    { name: 'Water Board', rate: 93, total: 1284 },
    { name: 'Electricity Board', rate: 91, total: 1105 },
    { name: 'Public Works (Roads)', rate: 89, total: 1424 },
    { name: 'Municipal Corp', rate: 96, total: 2450 }
  ];

  const activeEmergencies = complaints.filter(c => c.isEmergency || c.priority === 'CRITICAL');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              COMMAND CENTER LIVE
            </span>
            <span className="text-xs text-slate-400 font-mono">CITY ZONE MAP 1-15</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Good morning, Administrator</h1>
          <p className="text-xs text-slate-300 mt-0.5">City-wide citizen grievance intelligence & predictive response analytics.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('live-calls')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span>Open Live Call Center</span>
          </button>
          <button
            onClick={() => onNavigate('incidents')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <span>View Incident Clusters (3)</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase">Total Complaints</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.totalComplaints.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>+12.4% vs last month</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase">Resolved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.resolved.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">77.8% resolution rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase">Pending</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.pending.toLocaleString()}</div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">16.9% active queue</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold text-red-700 uppercase">SLA Breached</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-red-600">{kpi.slaBreached}</div>
          <div className="text-[10px] text-red-600 font-medium mt-1">5.1% breach rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-300 bg-red-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold text-red-800 uppercase">Emergency</span>
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-red-700">{kpi.emergencyCases}</div>
          <div className="text-[10px] text-red-700 font-semibold mt-1">Immediate priority</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-semibold uppercase">Avg Resolution</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">{kpi.avgResolutionHours} hrs</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">-2.1 hrs vs benchmark</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Complaint & Resolution Trend (30 Days)</h3>
              <p className="text-[11px] text-slate-500">Daily intake volume versus resolved citizen complaints</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="complaints" name="Intake Complaints" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved Complaints" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Complaint Categories</h3>
          <p className="text-[11px] text-slate-500 mb-4">Volume breakdown by issue domain</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
