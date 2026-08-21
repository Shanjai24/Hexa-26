import React, { useState } from 'react';
import { Search, MapPin, Eye, MessageSquare } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function ComplaintManagementView({ 
  complaints, 
  onSelectComplaint, 
  searchQuery, 
  setSearchQuery 
}) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const filteredComplaints = complaints.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    const getStr = (v) => (v && typeof v === 'object' && v.name ? String(v.name) : String(v || ''));
    const matchesSearch = !q ||
      getStr(c.id).toLowerCase().includes(q) ||
      getStr(c.citizen).toLowerCase().includes(q) ||
      getStr(c.location).toLowerCase().includes(q) ||
      getStr(c.category).toLowerCase().includes(q) ||
      getStr(c.department).toLowerCase().includes(q);

    const cmpDeptStr = getStr(c.department || c.category);
    const matchesDept = selectedDept === 'All' || cmpDeptStr === selectedDept || cmpDeptStr.includes(selectedDept);
    const matchesPriority = selectedPriority === 'All' || c.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

    return matchesSearch && matchesDept && matchesPriority && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Citizen Complaints Repository</h1>
          <p className="text-xs text-slate-500">Central command record of classified helpline grievances</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search complaint ID, citizen name, location..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
            />
          </div>

          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
            <option value="All">All Departments</option>
            <option value="Water Board">Water Board</option>
            <option value="Electricity Board">Electricity Board</option>
            <option value="Municipal Corporation">Municipal Corporation</option>
            <option value="Public Works">Public Works</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
            <tr>
              <th className="py-3.5 px-4">Complaint ID</th>
              <th className="py-3.5 px-4">Citizen</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">SLA Remaining</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredComplaints.map((cmp) => (
              <tr key={cmp.id} onClick={() => onSelectComplaint(cmp)} className="hover:bg-slate-50 cursor-pointer">
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {cmp.duplicateReportsCount > 1 && (
                    <div className="mb-1">
                      <span 
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black tracking-wide shadow-2xs animate-pulse"
                        title={`Same report mentioned ${cmp.duplicateReportsCount} times in ${cmp.location}! Grouped to prevent wasted work.`}
                      >
                        <MessageSquare className="w-3 h-3 fill-current text-white shrink-0" />
                        <span>{cmp.duplicateReportsCount}</span>
                      </span>
                    </div>
                  )}
                  <div className="font-mono font-bold text-blue-700">{cmp.id}</div>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">{cmp.citizen}</td>
                <td className="py-3.5 px-4 font-medium text-slate-700">{cmp.category}</td>
                <td className="py-3.5 px-4 text-slate-600">{cmp.location}</td>
                <td className="py-3.5 px-4"><PriorityBadge priority={cmp.priority} /></td>
                <td className="py-3.5 px-4 font-semibold text-slate-800">{cmp.department}</td>
                <td className="py-3.5 px-4"><StatusBadge status={cmp.status} /></td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{cmp.slaRemaining}</td>
                <td className="py-3.5 px-4 text-right">
                  <button onClick={(e) => { e.stopPropagation(); onSelectComplaint(cmp); }} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200 font-semibold text-[11px]">
                    Inspect
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
