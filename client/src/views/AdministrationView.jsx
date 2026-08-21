import React from 'react';
import { Building2 } from 'lucide-react';

export default function AdministrationView({ departments }) {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h1 className="text-xl font-bold text-slate-900">System Administration & Governance</h1>
        <p className="text-xs text-slate-500">Configure municipal wings, officer roles, and SLA thresholds</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="py-3 px-4">Department Name</th>
              <th className="py-3 px-4">Active Officers</th>
              <th className="py-3 px-4">Total Complaints</th>
              <th className="py-3 px-4">SLA Compliance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {departments.map((dept, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{dept.name}</td>
                <td className="py-3 px-4 font-semibold text-slate-700">{dept.activeOfficers} officers</td>
                <td className="py-3 px-4 font-mono font-semibold text-slate-800">{dept.complaints.toLocaleString()}</td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-600">{dept.slaCompliance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
