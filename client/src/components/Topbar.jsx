import React, { useState, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Calendar, UserCheck, Shield, ChevronDown, Building2, User, Sparkles } from 'lucide-react';

export default function Topbar({ 
  searchQuery, 
  setSearchQuery, 
  setCurrentView, 
  emergencyCount, 
  currentUser, 
  setCurrentUser,
  onTriggerEmergencyModal,
  notifications = []
}) {
  const [time, setTime] = useState(new Date());
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.name === 'Super Administrator';
  const isCitizen = currentUser?.role === 'CITIZEN' || currentUser?.role?.toLowerCase().includes('citizen') || currentUser?.view === 'citizen-portal';

  const superAdminRoles = [
    { name: 'Super Admin', role: 'Overall Organization Control', email: 'superadmin@civicsense.gov.in', view: 'super-admin' },
    { name: 'Water Board Admin', role: 'Water Supply Department', email: 'water.admin@civicsense.gov.in', departmentId: 'Water Board', view: 'dept-dashboard' },
    { name: 'Electricity Board Admin', role: 'Electricity Department', email: 'elec.admin@civicsense.gov.in', departmentId: 'Electricity Board', view: 'dept-dashboard' },
    { name: 'Fire & Rescue Admin', role: 'Fire Emergency Dept', email: 'fire.admin@civicsense.gov.in', departmentId: 'Fire & Rescue', view: 'dept-dashboard' },
    { name: 'Healthcare Admin', role: 'Healthcare Department', email: 'health.admin@civicsense.gov.in', departmentId: 'Healthcare', view: 'dept-dashboard' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs font-sans">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80 lg:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint ID, citizen, location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Emergency Alert Indicator (Only for Staff when active emergencies > 0) */}
        {!isCitizen && emergencyCount > 0 && (
          <button
            onClick={onTriggerEmergencyModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors shadow-2xs group cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <AlertTriangle className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
            <span>Emergency Alert ({emergencyCount})</span>
          </button>
        )}

        {/* Date / Time */}
        <div className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-600 text-xs font-medium whitespace-nowrap shrink-0">
          <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="whitespace-nowrap font-medium">{time.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-800 font-bold whitespace-nowrap">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>

        {/* Notifications Icon with Real-Time Unread Badge */}
        <button
          onClick={() => setCurrentView('notifications')}
          className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200 shrink-0"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {notifications.filter(n => !n.read).length > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
              {notifications.filter(n => !n.read).length}
            </span>
          ) : null}
        </button>

        {/* User Profile Pill */}
        {isSuperAdmin ? (
          /* Super Admin Switcher (with dropdown) */
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer bg-white shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {currentUser ? currentUser.name : 'Super Administrator'}
                </div>
                <div className="text-[10px] text-blue-600 font-bold truncate max-w-[130px]">
                  Super Admin Control
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2.5 px-2 z-50 animate-in fade-in">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Switch Admin Domain</span>
                </div>
                {superAdminRoles.map((r, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentUser(r);
                      setCurrentView(r.view);
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left hover:bg-blue-50 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-700 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{r.name}</span>
                  </button>
                ))}
                <div className="pt-1.5 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      setShowRoleMenu(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Citizen & Department Users: Clean Box with NO arrow and NO dropdown */
          <div className="flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50/80 shadow-2xs">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
              isCitizen ? 'bg-indigo-600' : 'bg-blue-600'
            }`}>
              {isCitizen ? <User className="w-3.5 h-3.5 text-white" /> : <Shield className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-[140px]">
                {currentUser ? currentUser.name : 'Citizen User'}
              </div>
              <div className="text-[10px] text-blue-600 font-bold truncate max-w-[140px]">
                {currentUser?.department || currentUser?.role || 'Public Voice Portal'}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}



