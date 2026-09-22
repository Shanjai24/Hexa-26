import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Play, Pause, Volume2, VolumeX, Flame, Sparkles, CheckCircle2, 
  AlertTriangle, Radio, ShieldCheck, ArrowRight, Layers, FilePlus, UserCheck, 
  Building2, Globe2, Mic, PhoneForwarded, Clock, MapPin, Zap, AlertOctagon
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function LiveCallCenterView({ 
  queue = [], 
  onSelectCall, 
  onCreateComplaint, 
  onNavigate 
}) {
  const [callList, setCallList] = useState(queue);
  const [selectedCall, setSelectedCall] = useState(queue[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showEnglish, setShowEnglish] = useState(true);
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  const [simulatingNewCall, setSimulatingNewCall] = useState(false);
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeSuccess, setIntakeSuccess] = useState(null);

  const getAuthAudioUrl = (url) => {
    if (!url) return '';
    const token = localStorage.getItem('civicsense_token');
    if (!token) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  };

  // Sync initial queue
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

  // Feature 1 & 2: Test real auditable intake pipeline call
  const handleSimulateIntakePipeline = async () => {
    setIntakeLoading(true);
    setIntakeSuccess(null);
    try {
      // Create audio sample blob
      const sampleBlob = new Blob(['RIFF....WAVEfmt ....data....'], { type: 'audio/wav' });
      const testPhone = '+9198404' + Math.floor(10000 + Math.random() * 90000);
      const formData = new FormData();
      formData.append('audio', sampleBlob, 'citizen_call.wav');
      formData.append('phoneNumber', testPhone);

      const res = await api.intakeCall(formData);
      if (res && res.callRecordId) {
        const newRecord = {
          id: res.callRecordId,
          phone: testPhone,
          callerName: 'Verified Caller',
          language: res.language === 'ta' ? 'Tamil' : 'English',
          duration: `00:${String(res.durationSeconds || 15).padStart(2, '0')}`,
          status: res.isFlaggedSpam ? 'SPAM FLAGGED' : 'Live Audio Recorded',
          aiConfidence: 98,
          priority: res.isFlaggedSpam ? 'Low' : 'High',
          location: 'Anna Nagar West',
          rawTranscript: res.transcript,
          englishTranscript: res.transcript,
          aiCategory: res.isFlaggedSpam ? 'Spam Alert' : 'Water Supply',
          aiDept: res.isFlaggedSpam ? 'Helpline Desk' : 'Water Board',
          sentiment: res.isFlaggedSpam ? 'Suspicious' : 'Frustrated',
          urgencyScore: res.isFlaggedSpam ? 10 : 85,
          emergency: false,
          isFlaggedSpam: res.isFlaggedSpam,
          summary: res.transcript,
          audioUrl: res.audioFilePath
        };

        setCallList(prev => [newRecord, ...prev]);
        setSelectedCall(newRecord);
        setIntakeSuccess(`Call record ${res.callRecordId} created audit-safe!`);
        setTimeout(() => setIntakeSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Call intake error:', err);
    } finally {
      setIntakeLoading(false);
    }
  };

  const handleSimulateNewCall = () => {
    setSimulatingNewCall(true);
    setTimeout(() => {
      const isSpamSim = Math.random() > 0.6;
      const newCall = {
        id: `CALL-${Math.floor(10460 + Math.random() * 80)}`,
        phone: isSpamSim ? '+91 98404 99999' : '+91 98404 ' + Math.floor(10000 + Math.random() * 90000),
        callerName: isSpamSim ? 'Repeat Caller' : 'Rajesh V',
        language: 'English',
        duration: isSpamSim ? '00:08' : '00:15',
        status: isSpamSim ? 'SPAM FLAGGED' : 'AI Transcribing Live',
        aiConfidence: 99,
        priority: isSpamSim ? 'Low' : 'High',
        location: 'Anna Nagar West',
        rawTranscript: isSpamSim 
          ? 'Hello testing testing helpline line is anyone there hello hello'
          : 'Drinking water pipeline broke this morning, clean water flooding street grid. Please send water board technician.',
        englishTranscript: isSpamSim
          ? 'Hello testing helpline line is anyone there hello'
          : 'Drinking water pipeline broke this morning, clean water flooding street grid. Please send water board technician.',
        aiCategory: isSpamSim ? 'Spam Filter' : 'Water Supply',
        aiDept: isSpamSim ? 'Helpline Desk' : 'Water Board',
        sentiment: isSpamSim ? 'Suspicious' : 'Urgent',
        urgencyScore: isSpamSim ? 15 : 92,
        emergency: !isSpamSim,
        isFlaggedSpam: isSpamSim,
        summary: isSpamSim 
          ? 'Repeat spam caller detected (5 calls in 24h).' 
          : 'Underground drinking water main broken in Anna Nagar West flooding road corridor.'
      };

      setCallList(prev => [newCall, ...prev]);
      setSelectedCall(newCall);
      setSimulatingNewCall(false);
    }, 600);
  };

  const activeCount = callList.length;
  const emergencyCount = callList.filter(c => c.emergency || c.priority?.toLowerCase() === 'critical').length;
  const spamCount = callList.filter(c => c.isFlaggedSpam).length;

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
            Real-time speech transcription, multilingual NLP, audit-safe call intake & automated spam detection.
          </p>
          {intakeSuccess && (
            <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              ✓ {intakeSuccess}
            </span>
          )}
        </div>

        {/* Counter Pills + Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSimulateIntakePipeline}
            disabled={intakeLoading}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Mic className="w-4 h-4" />
            <span>{intakeLoading ? 'Processing Intake...' : '🎙️ Test Call Intake'}</span>
          </button>

          <button
            onClick={handleSimulateNewCall}
            disabled={simulatingNewCall}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <PhoneForwarded className="w-4 h-4" />
            <span>{simulatingNewCall ? 'Connecting...' : '📞 Simulate Incoming'}</span>
          </button>

          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[60px]">
            <span className="text-[9px] font-extrabold text-blue-600 uppercase block">Active</span>
            <span className="text-sm font-black text-blue-900 font-mono">{String(activeCount).padStart(2, '0')}</span>
          </div>

          <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl text-center min-w-[60px]">
            <span className="text-[9px] font-extrabold text-red-600 uppercase block">Critical</span>
            <span className="text-sm font-black text-red-700 font-mono">{String(emergencyCount).padStart(2, '0')}</span>
          </div>

          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[60px]">
            <span className="text-[9px] font-extrabold text-amber-600 uppercase block">Spam</span>
            <span className="text-sm font-black text-amber-800 font-mono">{String(spamCount).padStart(2, '0')}</span>
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
              const isSpam = Boolean(call.isFlaggedSpam);

              return (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isSpam
                      ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
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
                      {isSpam && (
                        <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" /> POSSIBLE SPAM
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isSpam ? 'bg-amber-200 text-amber-900' : isCritical ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isSpam ? 'SPAM ALERT' : call.priority?.toUpperCase()}
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
                      {selectedCall.isFlaggedSpam ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> REPEAT SPAM DETECTED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30">
                          RECORDED AUDIT-SAFE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Caller: <strong className="text-white">{selectedCall.phone}</strong> • Language: <strong className="text-cyan-300">{selectedCall.language}</strong> • Area: <strong className="text-white">{selectedCall.location}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
                    title={isPlaying ? 'Pause Audio' : 'Play Audio'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>

              {/* Audio Playback Element */}
              {selectedCall.audioUrl && (
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-blue-600" />
                    Caller Audio Recording:
                  </span>
                  <audio controls src={getAuthAudioUrl(selectedCall.audioUrl)} className="h-8 max-w-sm" />
                </div>
              )}

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Spam Alert Notice if flagged */}
                {selectedCall.isFlaggedSpam && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900">Flagged by Repeat-Caller Spam Detector</h4>
                      <p className="text-[11px] text-red-700 mt-0.5">
                        High call volume or repetitive transcripts from phone number <strong>{selectedCall.phone}</strong>. Ticket remains preserved for audit but flagged for supervisor review.
                      </p>
                    </div>
                  </div>
                )}

                {/* Transcripts Toggle */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {showEnglish ? 'AI English Translation' : 'Spoken Voice Transcript'}
                    </span>
                    <button
                      onClick={() => setShowEnglish(!showEnglish)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Switch to {showEnglish ? selectedCall.language : 'English'}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 leading-relaxed min-h-[90px]">
                    "{showEnglish ? (selectedCall.englishTranscript || selectedCall.rawTranscript) : selectedCall.rawTranscript}"
                  </div>
                </div>

                {/* AI Classification Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-600 font-bold block">CATEGORY</span>
                    <span className="font-extrabold text-blue-950">{selectedCall.aiCategory}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">DEPARTMENT</span>
                    <span className="font-extrabold text-slate-900">{selectedCall.aiDept}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">SENTIMENT</span>
                    <span className="font-extrabold text-slate-900">{selectedCall.sentiment}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">URGENCY SCORE</span>
                    <span className="font-extrabold text-slate-900 font-mono">{selectedCall.urgencyScore || 85}/100</span>
                  </div>
                </div>

                {/* Summary & Create Ticket Button */}
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    AI Actionable Recommendation
                  </span>
                  <p className="text-xs font-semibold text-emerald-950">
                    {selectedCall.summary}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  {showCreatedToast && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                      Complaint ticket generated successfully!
                    </span>
                  )}
                  <button
                    onClick={handleCreate}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <FilePlus className="w-4 h-4" />
                    <span>Dispatch Complaint to {selectedCall.aiDept}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
