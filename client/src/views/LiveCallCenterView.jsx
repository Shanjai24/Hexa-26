import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Play, Pause, Volume2, VolumeX, Flame, Sparkles, CheckCircle2, 
  AlertTriangle, Radio, ShieldCheck, ArrowRight, Layers, FilePlus, UserCheck, 
  Building2, Globe2, Mic, PhoneForwarded, Clock, MapPin, Zap
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';

export default function LiveCallCenterView({ 
  queue = [], 
  onSelectCall, 
  onCreateComplaint, 
  onNavigate 
}) {
  const [callList, setCallList] = useState(queue);
  const [selectedCall, setSelectedCall] = useState(queue[0] || null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  const [simulatingNewCall, setSimulatingNewCall] = useState(false);

  useEffect(() => {
    if (queue.length > 0 && !selectedCall) {
      setSelectedCall(queue[0]);
    }
  }, [queue]);

  const handleCreate = () => {
    if (!selectedCall) return;
    onCreateComplaint(selectedCall);
    setShowCreatedToast(true);
    setTimeout(() => setShowCreatedToast(false), 3500);
  };

  const handleSimulateNewCall = () => {
    setSimulatingNewCall(true);
    setTimeout(() => {
      const newCall = {
        id: `CALL-${Math.floor(10460 + Math.random() * 80)}`,
        phone: '+91 98404 ' + Math.floor(10000 + Math.random() * 90000),
        callerName: 'Rajesh V',
        language: 'English',
        duration: '00:15',
        status: 'AI Transcribing Live',
        aiConfidence: 99,
        priority: 'High',
        location: 'Anna Nagar West',
        rawTranscript: 'Drinking water pipeline broke this morning, clean water flooding street grid. Please send water board technician.',
        englishTranscript: 'Drinking water pipeline broke this morning, clean water flooding street grid. Please send water board technician.',
        aiCategory: 'Water Supply',
        aiDept: 'Water Board',
        sentiment: 'Urgent',
        urgencyScore: 92,
        emergency: true,
        summary: 'Underground drinking water main broken in Anna Nagar West flooding road corridor.'
      };

      setCallList(prev => [newCall, ...prev]);
      setSelectedCall(newCall);
      setSimulatingNewCall(false);
    }, 800);
  };

  const activeCount = callList.length;
  const emergencyCount = callList.filter(c => c.emergency || c.priority?.toLowerCase() === 'critical').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Live Helpline Telephony Inbound Stream
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-blue-600" />
            <span>Citizen Call Intelligence Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time speech transcription, multilingual NLP, automated triage & instant department routing.
          </p>
        </div>

        {/* Counter Pills + Simulate Call Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateNewCall}
            disabled={simulatingNewCall}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>{simulatingNewCall ? 'Connecting Call...' : '📞 Simulate Incoming Call'}</span>
          </button>

          <div className="px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[70px]">
            <span className="text-[9px] font-extrabold text-blue-600 uppercase block">Active</span>
            <span className="text-base font-black text-blue-900 font-mono">{String(activeCount).padStart(2, '0')}</span>
          </div>

          <div className="px-3.5 py-2 bg-red-50 border border-red-200 rounded-xl text-center min-w-[70px]">
            <span className="text-[9px] font-extrabold text-red-600 uppercase block">Critical</span>
            <span className="text-base font-black text-red-700 font-mono">{String(emergencyCount).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Call Queue */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Live Inbound Call Queue</h3>
            <span className="text-[10px] text-slate-400 font-bold">{callList.length} Calls in Stream</span>
          </div>

          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {callList.map((call) => {
              const isSelected = selectedCall?.id === call.id;
              const isCritical = call.emergency || call.priority?.toLowerCase() === 'critical';

              return (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isCritical
                      ? 'bg-red-50/50 border-red-200 hover:bg-red-50/80 hover:border-red-300'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">{call.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[9px] font-extrabold border border-slate-200">
                        {call.language}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {call.priority?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{call.phone}</span>
                      {call.callerName && <span className="text-slate-400 font-normal">({call.callerName})</span>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 font-semibold">{call.duration}</span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1 italic mb-2">
                    "{call.englishTranscript || call.rawTranscript}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-500 font-bold">
                      <Building2 className="w-3 h-3 text-blue-600" />
                      <span>{call.aiDept}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-700 font-bold font-mono">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>{call.aiConfidence}% Confidence</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Call Live Audio Inspector */}
        <div className="lg:col-span-7 space-y-5">
          {selectedCall && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
              {/* Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <PhoneCall className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">LIVE CALL MONITOR ({selectedCall.id})</h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30">
                        LIVE CALL CONNECTED
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Caller: <strong className="text-white">{selectedCall.phone}</strong> • Language: <strong className="text-cyan-300">{selectedCall.language}</strong> • Area: <strong className="text-white">{selectedCall.location}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause Audio' : 'Play Audio'}</span>
                </button>
              </div>

              {/* Audio Waveform Stream */}
              <div className="p-4 bg-slate-950 text-white border-b border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 px-1 font-mono">
                  <span>LIVE SPEECH AUDIO INPUT STREAM</span>
                  <span className="text-cyan-400 font-bold">16kHz PCM • CPU Whisper Real-Time Engine</span>
                </div>
                <div className="h-14 bg-slate-900/90 rounded-2xl p-2.5 flex items-center justify-center gap-1.5 border border-slate-800">
                  {[40, 75, 30, 90, 50, 100, 60, 85, 45, 95, 35, 70, 55, 90, 40, 80, 60, 30, 85, 50, 95, 40, 70, 85, 55, 90, 65, 40].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${isPlaying ? 'bg-gradient-to-t from-blue-600 to-cyan-400 animate-pulse' : 'bg-slate-700'}`}
                      style={{ height: isPlaying ? `${Math.max(20, (h + (i % 5) * 5) % 100)}%` : '15%' }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Live Transcripts & Structured Intelligence */}
              <div className="p-6 space-y-4 bg-white">
                {/* Bilingual Speech Transcript */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                      <Globe2 className="w-3.5 h-3.5" />
                      Live Whisper STT Transcript
                    </span>
                    <button
                      onClick={() => setShowEnglish(!showEnglish)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline"
                    >
                      {showEnglish ? 'Show Original Language' : 'Show English Translation'}
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-800 font-medium italic leading-relaxed">
                      "{showEnglish ? (selectedCall.englishTranscript || selectedCall.rawTranscript) : selectedCall.rawTranscript}"
                    </p>
                  </div>
                </div>

                {/* AI Extracted Structured Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100">
                    <span className="text-[10px] text-slate-400 font-semibold block">Target Dept</span>
                    <span className="font-extrabold text-blue-700 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{selectedCall.aiDept}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold block">Urgency / Risk</span>
                    <span className="font-extrabold text-red-600 mt-0.5 block">
                      {selectedCall.urgencyScore ? `${selectedCall.urgencyScore}/100` : '88/100'} ({selectedCall.priority})
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold block">Caller Sentiment</span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {selectedCall.sentiment || 'Frustrated'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold block">AI Confidence</span>
                    <span className="font-bold text-emerald-600 mt-0.5 block">
                      {selectedCall.aiConfidence}% Validated
                    </span>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs">
                  <strong className="text-blue-900">AI Structured Summary: </strong>
                  <span className="text-slate-700">{selectedCall.summary}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleCreate}
                    className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Convert Call to Complaint & Dispatch to {selectedCall.aiDept}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('incidents')}
                    className="w-full sm:w-auto px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Layers className="w-4 h-4 text-slate-500" />
                    <span>View Duplicate Incidents</span>
                  </button>
                </div>

                {showCreatedToast && (
                  <div className="p-3.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Complaint registered & routed to {selectedCall.aiDept} Unassigned Queue!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
