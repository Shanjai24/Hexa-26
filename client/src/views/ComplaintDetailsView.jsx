import React, { useState } from 'react';
import { ArrowLeft, MapPin, User, FileText, Sparkles, Building, Layers, CheckCircle2 } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function ComplaintDetailsView({ complaint, onBack, onNavigate, onUpdateStatus }) {
  const [currentStatus, setCurrentStatus] = useState(complaint?.status || 'In Progress');

  if (!complaint) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Complaints</span>
        </button>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={complaint.priority} />
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">{complaint.id} — {complaint.category}</h1>
        <p className="text-xs text-slate-500">{complaint.location} ({complaint.zone}) • Created: {complaint.created}</p>

        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            AI Summary
          </span>
          <p className="text-xs font-semibold text-blue-950 mt-1">"{complaint.aiSummary}"</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">CITIZEN</span>
            <span className="font-bold text-slate-900">{complaint.citizen}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">DEPARTMENT</span>
            <span className="font-bold text-blue-700">{complaint.department}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">OFFICER</span>
            <span className="font-bold text-slate-800">{complaint.assignedOfficer}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-semibold block">SLA REMAINING</span>
            <span className="font-bold text-slate-900 font-mono">{complaint.slaRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
