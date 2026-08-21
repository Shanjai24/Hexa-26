import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, Eye, EyeOff, User, Phone, ChevronRight, UserCheck, Droplets, Zap, Flame, HeartPulse } from 'lucide-react';

const DEMO_ROLES = [
  { 
    name: 'Water Board Admin', 
    role: 'Water Supply Dept', 
    email: 'water.admin@civicsense.gov.in', 
    password: 'admin123', 
    view: 'dept-dashboard', 
    departmentId: 'Water Board',
    icon: Droplets,
    color: 'from-blue-500 to-cyan-600',
    badge: 'CWB'
  },
  { 
    name: 'Electricity Admin', 
    role: 'Electricity Board', 
    email: 'elec.admin@civicsense.gov.in', 
    password: 'admin123', 
    view: 'dept-dashboard', 
    departmentId: 'Electricity Board',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    badge: 'TNEB'
  },
  { 
    name: 'Fire & Rescue Admin', 
    role: 'Fire Emergency Dept', 
    email: 'fire.admin@civicsense.gov.in', 
    password: 'admin123', 
    view: 'dept-dashboard', 
    departmentId: 'Fire & Rescue',
    icon: Flame,
    color: 'from-red-500 to-rose-600',
    badge: 'TNFRS'
  },
  { 
    name: 'Healthcare Admin', 
    role: 'Healthcare & Hygiene', 
    email: 'health.admin@civicsense.gov.in', 
    password: 'admin123', 
    view: 'dept-dashboard', 
    departmentId: 'Healthcare',
    icon: HeartPulse,
    color: 'from-emerald-500 to-teal-600',
    badge: 'DHS'
  },
  { 
    name: 'Citizen User', 
    role: 'Public Voice Portal', 
    email: 'rahul.k@gmail.com', 
    phone: '+91 98400 11223',
    password: 'citizen123', 
    view: 'citizen-portal',
    icon: UserCheck,
    color: 'from-indigo-500 to-purple-600',
    badge: 'CITIZEN'
  }
];

export default function LoginView({ onLogin }) {
  React.useEffect(() => { localStorage.removeItem('civicsense_token'); }, []);
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regDept, setRegDept] = useState('Water Board');
  const [regRole, setRegRole] = useState('citizen-portal');
  const [regError, setRegError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const demo = DEMO_ROLES.find(r => r.email.toLowerCase() === email.toLowerCase().trim() && r.password === password);
    if (demo) { onLogin(demo); return; }
    
    // Also allow superadmin fallback
    if (email.toLowerCase().trim() === 'superadmin@civicsense.gov.in' && password === 'admin123') {
      onLogin({ name: 'Super Administrator', role: 'SUPER_ADMIN', email: 'superadmin@civicsense.gov.in', view: 'super-admin' });
      return;
    }

    const stored = JSON.parse(localStorage.getItem('civicsense_users') || '[]');
    const user = stored.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
    if (user) { onLogin(user); return; }
    setError('Invalid email or password. Click a Quick Demo persona on the left.');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setRegError('');
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPass.trim()) {
      setRegError('All fields are required.'); return;
    }
    const stored = JSON.parse(localStorage.getItem('civicsense_users') || '[]');
    if (stored.find(u => u.email.toLowerCase() === regEmail.toLowerCase())) {
      setRegError('This email is already registered. Please sign in.'); return;
    }
    const newUser = {
      name: regName.trim(), 
      role: regRole === 'dept-dashboard' ? `${regDept} Admin` : 'Citizen User',
      email: regEmail.trim().toLowerCase(), 
      phone: regPhone.trim(),
      password: regPass, 
      view: regRole,
      departmentId: regRole === 'dept-dashboard' ? regDept : null,
      department: regRole === 'dept-dashboard' ? regDept : null
    };
    stored.push(newUser);
    localStorage.setItem('civicsense_users', JSON.stringify(stored));
    onLogin(newUser);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-800 min-h-[640px]">

        {/* LEFT: Brand Hero + Quick Demo Personas */}
        <div className="md:w-5/12 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide">CivicSense AI</h1>
                <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-widest">Multi-Department Intelligence</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Automated AI Voice Grievance Routing & Dedicated Department Command Dashboards.
            </p>

            {/* Quick Demo Login Buttons (Filtered to 5 Core Roles) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider">⚡ 1-Click Quick Demo Login</span>
                <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">Instant Access</span>
              </div>

              {DEMO_ROLES.map((r, i) => {
                const Icon = r.icon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setEmail(r.email);
                      setPassword(r.password);
                      onLogin(r);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 transition-all text-left group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-xs font-bold truncate">{r.name}</p>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">{r.badge}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] truncate">{r.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white shrink-0 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Official Portal • Govt of Tamil Nadu</span>
            <span className="font-mono font-bold text-cyan-400">v5.2 AI</span>
          </div>
        </div>

        {/* RIGHT: Login / Register Form */}
        <div className="md:w-7/12 p-8 lg:p-12 bg-white flex flex-col justify-between">
          <div>
            {/* Tab switch */}
            <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-8 w-fit">
              <button
                onClick={() => { setTab('login'); setError(''); setRegError(''); }}
                className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  tab === 'login' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('register'); setError(''); setRegError(''); }}
                className={`px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  tab === 'register' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                New? Register Account
              </button>
            </div>

            {tab === 'login' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Sign in to Platform</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter your login credentials, or click any persona on the left.</p>
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email / Official ID</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="e.g. water.admin@civicsense.gov.in"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Login to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {tab === 'register' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Create New Account</h3>
                  <p className="text-xs text-slate-500 mt-1">Register as a Citizen or Department Official.</p>
                </div>

                {regError && (
                  <div className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                    ⚠️ {regError}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="Rahul Kumar"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          placeholder="+91 98400 11223"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        required
                        value={regPass}
                        onChange={e => setRegPass(e.target.value)}
                        placeholder="Choose password"
                        className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                      <select
                        value={regRole}
                        onChange={e => setRegRole(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                      >
                        <option value="citizen-portal">Citizen User</option>
                        <option value="dept-dashboard">Department Admin</option>
                      </select>
                    </div>

                    {regRole === 'dept-dashboard' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                        <select
                          value={regDept}
                          onChange={e => setRegDept(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                        >
                          <option>Water Board</option>
                          <option>Electricity Board</option>
                          <option>Fire & Rescue</option>
                          <option>Healthcare</option>
                          <option>Sanitation</option>
                          <option>Municipal Corporation</option>
                          <option>Police</option>
                          <option>Transport</option>
                          <option>Public Works</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer mt-2"
                  >
                    <span>Register & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-slate-400">
              CivicSense AI Citizen Call Intelligence & Multi-Department Response Platform
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
