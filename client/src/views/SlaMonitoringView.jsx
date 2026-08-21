import React from 'react';
import PriorityBadge from '../components/PriorityBadge';

export default function SlaMonitoringView({ complaints, departments }) {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">SLA Performance Command</h1>
        <p className="text-xs text-slate-500">Service Level Agreement compliance tracking</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">SLA Compliance</span>
          <div className="text-2xl font-bold text-emerald-600">94.8%</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase block mb-1">At Risk</span>
          <div className="text-2xl font-extrabold text-amber-700">82</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-2xs">
          <span className="text-[11px] font-bold text-red-800 uppercase block mb-1">Breached</span>
          <div className="text-2xl font-extrabold text-red-600">648</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Avg Resolution</span>
          <div className="text-2xl font-bold text-slate-900">18.4 hrs</div>
        </div>
      </div>
    </div>
  );
}
