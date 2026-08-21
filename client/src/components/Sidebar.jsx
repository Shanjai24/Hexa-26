import React from 'react';
import { 
  LayoutDashboard, 
  Building2,
  Users,
  FileText, 
  PhoneCall, 
  Layers, 
  UserCheck, 
  Map, 
  Sparkles, 
  Clock, 
  User, 
  MessageSquare, 
  Bell, 
  Settings, 
  LogOut,
  ShieldCheck,
  Flame,
  Activity,
  History
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, currentUser, setCurrentUser, emergencyCount }) {
  const role = currentUser?.role || 'SUPER_ADMIN';

  const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN' || currentUser?.name?.includes('Administrator');
  const isDeptAdmin = role === 'DEPT_ADMIN' || currentUser?.role?.includes('Dept') || currentUser?.name?.includes('Admin');
  const isWorker = role === 'WORKER' || role === 'OFFICER' || currentUser?.role?.includes('Worker') || currentUser?.name?.includes('Arun');
  const isCitizen = role === 'CITIZEN' || currentUser?.role?.toLowerCase().includes('citizen') || currentUser?.view === 'citizen-portal' || currentUser?.name?.toLowerCase().includes('rahul');

  const mainNav = [
    { id: 'super-admin', label: 'Overall Org Control', icon: ShieldCheck, show: isSuperAdmin },
    { id: 'dept-dashboard', label: 'Department Dashboard', icon: Building2, show: isSuperAdmin || isDeptAdmin },
    { id: 'complaints', label: 'Complaints Queue', icon: FileText, show: isSuperAdmin || isDeptAdmin || isWorker },
    { id: 'officer', label: 'Workers & Staff', icon: Users, show: isSuperAdmin || isDeptAdmin || isWorker },
    { id: 'live-calls', label: 'Live Helpline Calls', icon: PhoneCall, show: isSuperAdmin },
  ].filter(i => i.show);

  const analyticsNav = [
    { id: 'heatmap', label: 'GIS Heatmap', icon: Map, show: isSuperAdmin || isDeptAdmin },
    { id: 'ai-insights', label: 'AI Predictive Insights', icon: Sparkles, show: isSuperAdmin },
    { id: 'sla', label: 'SLA Monitoring', icon: Clock, show: isSuperAdmin || isDeptAdmin },
  ].filter(i => i.show);

  const citizenNav = [
    { id: 'citizen-portal', label: 'Citizen Portal & Voice', icon: User, show: true },
    { id: 'citizen-chatbot', label: 'AI Helpline Assistant', icon: MessageSquare, show: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, show: true },
  ].filter(i => i.show);

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 z-30 font-sans">
      {/* Platform Branding */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-wide text-base">CivicSense AI</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-1 py-0.5 rounded border border-blue-500/30">GOV</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">Multi-Dept Intelligence</p>
        </div>
      </div>

      {/* Emergency Quick Bar */}
      {emergencyCount > 0 && !isCitizen && (
        <div 
          onClick={() => setCurrentView('live-calls')}
          className="mx-3 mt-3 p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 flex items-center gap-2.5 cursor-pointer hover:bg-red-900/60 transition-all emergency-pulse"
        >
          <Flame className="w-4 h-4 text-red-400 animate-bounce" />
          <div className="flex-1 text-xs">
            <span className="font-bold text-red-300 block">{emergencyCount} Emergency Alert{emergencyCount > 1 ? 's' : ''}</span>
            <span className="text-[10px] text-red-400/90">Click to inspect active queue</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs font-medium">
        {/* OPERATIONS SECTION */}
        {mainNav.length > 0 && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Command Operations
            </div>
            <div className="space-y-0.5">
              {mainNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ANALYTICS SECTION */}
        {analyticsNav.length > 0 && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Analytics & GIS
            </div>
            <div className="space-y-0.5">
              {analyticsNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CITIZEN SERVICES SECTION */}
        {citizenNav.length > 0 && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Citizen Public Services
            </div>
            <div className="space-y-0.5">
              {citizenNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser ? currentUser.name.charAt(0) : 'S'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{currentUser ? currentUser.name : 'Super Admin'}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.department || currentUser?.role || 'Org Admin'}</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentUser(null)}
          title="Logout / Switch Role"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

