import React, { useState } from 'react';
import { Bell, Flame, Clock, Sparkles, CheckCircle2, UserCheck, ShieldAlert, ArrowRight, Check, Filter } from 'lucide-react';

export default function NotificationsView({ notifications = [], onNavigate }) {
  const [filter, setFilter] = useState('all');
  const [notifList, setNotifList] = useState([
    {
      id: 'N-101',
      category: 'Emergency',
      title: 'Structural Fire Alert Reported',
      text: 'Incident reported in Ambattur Zone 5. Fire tenders dispatched.',
      time: '5 mins ago',
      read: false,
      priority: 'CRITICAL',
      linkView: 'dept-dashboard'
    },
    {
      id: 'N-102',
      category: 'Assignment',
      title: 'Field Officer Assigned to Complaint CMP-10452',
      text: 'Water Board Admin assigned worker Arun Kumar (Zone 4 Maintenance Squad) to pipeline leakage.',
      time: '18 mins ago',
      read: false,
      priority: 'HIGH',
      linkView: 'complaints'
    },
    {
      id: 'N-103',
      category: 'SLA',
      title: 'SLA Priority Notice — 2h Remaining',
      text: 'Transformer spark ticket CMP-10454 in Electricity Board approaching SLA review window.',
      time: '45 mins ago',
      read: true,
      priority: 'HIGH',
      linkView: 'sla'
    },
    {
      id: 'N-104',
      category: 'Resolution',
      title: 'Complaint Resolved Successfully',
      text: 'Garbage accumulation cleared in T Nagar Zone 2. Citizen SMS verification sent.',
      time: '2 hours ago',
      read: true,
      priority: 'NORMAL',
      linkView: 'complaints'
    },
    {
      id: 'N-105',
      category: 'AI Alert',
      title: 'NLP Speech-to-Text Model Pipeline Updated',
      text: 'Tamil & English bilingual Whisper STT + Random Forest routing reached 96.4% confidence.',
      time: '4 hours ago',
      read: true,
      priority: 'NORMAL',
      linkView: 'ai-pipeline'
    }
  ]);

  const markAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markSingleRead = (id) => {
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = notifList.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'emergency') return n.category === 'Emergency' || n.priority === 'CRITICAL';
    if (filter === 'assignment') return n.category === 'Assignment' || n.category === 'Resolution';
    return true;
  });

  const unreadCount = notifList.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-blue-500/20 text-cyan-300 border border-blue-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              REAL-TIME EVENT STREAM
            </span>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-blue-400" />
            <span>Notification & Activity Center</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Live departmental dispatches, SLA alerts, citizen voice intake updates, and worker assignments.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Activity ({notifList.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            filter === 'unread' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('emergency')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'emergency' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Emergencies</span>
        </button>
        <button
          onClick={() => setFilter('assignment')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
            filter === 'assignment' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Assignments & Work</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.map(n => {
          const isEmergency = n.category === 'Emergency' || n.priority === 'CRITICAL';
          const isAssignment = n.category === 'Assignment';
          const isResolution = n.category === 'Resolution';
          const isSLA = n.category === 'SLA';

          return (
            <div
              key={n.id}
              onClick={() => markSingleRead(n.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-all cursor-pointer ${
                !n.read ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
              }`}
            >
              {/* Category Icon */}
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                isEmergency ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                isAssignment ? 'bg-gradient-to-br from-blue-600 to-indigo-600' :
                isResolution ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                isSLA ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                'bg-gradient-to-br from-slate-700 to-slate-900'
              }`}>
                {isEmergency ? <Flame className="w-5 h-5" /> :
                 isAssignment ? <UserCheck className="w-5 h-5" /> :
                 isResolution ? <CheckCircle2 className="w-5 h-5" /> :
                 isSLA ? <Clock className="w-5 h-5" /> :
                 <Sparkles className="w-5 h-5" />}
              </div>

              {/* Text & Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-xs font-extrabold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {n.title}
                    </h4>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isEmergency ? 'bg-red-100 text-red-700' :
                      isAssignment ? 'bg-blue-100 text-blue-800' :
                      isResolution ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {n.category}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.time}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{n.text}</p>
              </div>

              {/* Unread indicator */}
              {!n.read && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" title="Unread event" />
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No notifications found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
