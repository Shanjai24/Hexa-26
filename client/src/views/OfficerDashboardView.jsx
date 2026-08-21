import React, { useState } from 'react';
import { 
  UserCheck, Sparkles, Droplets, Wrench, AlertTriangle, CheckCircle2, 
  Clock, MapPin, Phone, ShieldCheck, ArrowRight, Activity, Filter 
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function OfficerDashboardView({ complaints, onSelectComplaint }) {
  // Filter complaints specifically for Water Board / Water Supply / Zone 4 Water complaints assigned to Officer Arun Kumar
  const waterComplaints = complaints.filter(c => 
    c.department === 'Water Board' || 
    c.category.includes('Water') || 
    c.assignedOfficer === 'Arun Kumar' || 
    c.zone === 'Zone 4'
  );

  const inProgressCount = waterComplaints.filter(c => c.status === 'In Progress' || c.status === 'IN_PROGRESS').length;
  const criticalCount = waterComplaints.filter(c => c.priority === 'CRITICAL' || c.priority === 'HIGH').length;
  const resolvedCount = waterComplaints.filter(c => c.status === 'Resolved' || c.status === 'RESOLVED').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Officer Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900 via-slate-900 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Water Department Field Operations Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Good morning, Officer Arun Kumar</h1>
          <p className="text-xs text-slate-300">
            Lead Field Engineer • Chennai Metrowater (Zone 4 Anna Nagar & Surrounding Grids)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Assigned Water Caseload</span>
            <span className="text-lg font-extrabold text-cyan-400">{waterComplaints.length} Tickets</span>
          </div>
          <div className="px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">Zone SLA Performance</span>
            <span className="text-lg font-extrabold text-emerald-400">96.2%</span>
          </div>
        </div>
      </div>

      {/* Field Officer Stat Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Active Water Complaints</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{waterComplaints.length}</div>
          <div className="text-[10px] text-slate-500 mt-1">Zone 4 Maintenance Grid</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-700 uppercase">Pipeline Repairs Active</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-700">{inProgressCount}</div>
          <div className="text-[10px] text-blue-600 font-medium mt-1">De-silting & Valve Crews On-site</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-700 uppercase">High Priority / Urgent</span>
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-[10px] text-red-600 font-medium mt-1">Immediate Field Action Target</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Resolved Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{resolvedCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">100% Citizen Verified</div>
        </div>
      </div>

      {/* Water Department Field Ticket Repository */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Water Department Field Caseload</h3>
            <p className="text-[11px] text-slate-500">Live ticket queue assigned to Officer Arun Kumar & Zone 4 Water Crew</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold rounded uppercase">
              Filter: Water Department Only
            </span>
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="py-3.5 px-4">Ticket ID</th>
              <th className="py-3.5 px-4">Issue Summary</th>
              <th className="py-3.5 px-4">Location Zone</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">SLA Countdown</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {waterComplaints.map((cmp) => (
              <tr key={cmp.id} onClick={() => onSelectComplaint(cmp)} className="hover:bg-slate-50 cursor-pointer">
                <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">{cmp.id}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs truncate">
                  {cmp.aiSummary || cmp.category}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  <div className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{cmp.location} ({cmp.zone})</span>
                  </div>
                </td>
                <td className="py-3.5 px-4"><PriorityBadge priority={cmp.priority} /></td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{cmp.slaRemaining}</td>
                <td className="py-3.5 px-4"><StatusBadge status={cmp.status} /></td>
                <td className="py-3.5 px-4 text-right">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectComplaint(cmp); }}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded border border-cyan-700 font-semibold text-[11px] cursor-pointer shadow-2xs"
                  >
                    Manage Field Task
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
