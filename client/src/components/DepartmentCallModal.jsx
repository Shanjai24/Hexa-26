import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, Mic, Square, Play, Pause, AlertTriangle, CheckCircle2, 
  X, Radio, Building2, ShieldAlert, Sparkles, Volume2, ArrowRight, Search, Zap
} from 'lucide-react';
import { api } from '../services/api.js';

export default function DepartmentCallModal({ isOpen, onClose, currentUser = null, onTrackTicket = null }) {
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || '+919840011223');
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Submission state
  const [callingState, setCallingState] = useState('idle'); // 'idle' | 'calling' | 'success' | 'error'
  const [callResult, setCallResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Feature 13 — Voice Reply TTS state
  const [confirmationAudioUrl, setConfirmationAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (currentUser?.phone) {
      setPhoneNumber(currentUser.phone);
    }
  }, [currentUser]);

  // Handle timer during recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setErrorMessage('');
    } catch (err) {
      console.error('Microphone access error:', err);
      setErrorMessage('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Generate synthetic audio for quick testing if user does not have a microphone
  const generateTestAudio = async (textSample) => {
    try {
      const sampleRate = 16000;
      const numChannels = 1;
      const durationSeconds = 3;
      const numSamples = sampleRate * durationSeconds;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * 2, true);
      view.setUint16(32, numChannels * 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * (i / sampleRate)) * 0.3 * (1 - i / numSamples);
        view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setRecordingSeconds(durationSeconds);
      setErrorMessage('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitCall = async () => {
    if (!audioBlob) {
      setErrorMessage('Please record your voice or select a quick test sample.');
      return;
    }
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setErrorMessage('Please provide a valid 10-15 digit caller phone number.');
      return;
    }

    setCallingState('calling');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'call_recording.wav');
      formData.append('phoneNumber', phoneNumber.trim());

      const response = await api.intakeCall(formData);
      if (response?.timeout) {
        throw new Error('The AI telephony service is spinning up from sleep mode (~30s on Render). Please wait a few seconds and tap Connect again.');
      }
      if (response && response.success && response.ticketId) {
        setCallResult(response);
        setCallingState('success');

        if (response.confirmationAudioUrl) {
          const PYTHON_ML_URL = import.meta.env.VITE_ML_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || '';
          const url = response.confirmationAudioUrl.startsWith('http')
            ? response.confirmationAudioUrl
            : `${PYTHON_ML_URL}${response.confirmationAudioUrl}`;
          setConfirmationAudioUrl(url);
        }
      } else {
        throw new Error(response?.error?.message || response?.error || 'Call processing failed.');
      }
    } catch (err) {
      console.error('Call intake error:', err);
      setCallingState('error');
      setErrorMessage(err.message || 'Call connection failed. Please retry.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-cyan-300">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">CivicSense AI Unified Helpline</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  1800-CIVICSENSE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single Virtual Helpline • Zero Human Delay • Automated Local AI Routing
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[82vh]">
          {callingState === 'success' && callResult ? (
            <div className="space-y-4 animate-in fade-in">
              {/* Success Hero */}
              <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-2">
                <div className="inline-flex p-2.5 bg-emerald-500/20 rounded-full text-emerald-400 shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-emerald-300 font-bold text-lg">Call Transcribed & Filed as ticket!</h4>
                <p className="text-xs text-slate-300">
                  AI successfully triaged your voice call and generated an official ticket:
                </p>
                <div 
                  data-testid="ticket-id" 
                  className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl font-mono text-2xl font-black text-emerald-400 max-w-xs mx-auto shadow-inner"
                >
                  {callResult.ticketId}
                </div>
              </div>

              {/* AI Classification & Target Department */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">AI-Routed Department</span>
                  <span className="text-sm font-bold text-blue-400 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    {callResult.department?.name || 'Municipal Department'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    SLA: {callResult.department?.slaHours || 24} hours target
                  </span>
                </div>

                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Extracted Entities (NER)</span>
                  <span className="text-xs font-semibold text-slate-200 block">
                    📍 {callResult.extractedLandmark || 'Area Detected'}
                  </span>
                  {callResult.extractedName && (
                    <span className="text-xs text-slate-400 block">
                      👤 {callResult.extractedName}
                    </span>
                  )}
                </div>
              </div>

              {/* Feature 13 — Spoken Confirmation Audio */}
              {confirmationAudioUrl && (
                <div className="p-3.5 bg-violet-950/40 border border-violet-500/40 rounded-xl flex items-start gap-3">
                  <Volume2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-violet-200 flex-1">
                    <strong className="block font-medium text-violet-300 mb-1">Spoken AI Voice Reply (Offline TTS)</strong>
                    <audio
                      src={confirmationAudioUrl}
                      autoPlay
                      controls
                      style={{ width: '100%', height: '32px', marginTop: '4px' }}
                    />
                  </div>
                </div>
              )}

              {/* Feature 11 — Classification Reasoning */}
              {callResult.classificationExplanation && (
                <div 
                  data-testid="classification-explanation" 
                  className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Explainable AI (XAI) Routing Decision:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {callResult.classificationExplanation.category?.topTerms?.slice(0, 5).map((term, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-mono">
                        +{term.term} ({Math.round(term.weight * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 space-y-1.5 text-xs">
                <span className="text-slate-400 block font-bold">Transcribed Audio:</span>
                <p className="text-slate-200 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  "{callResult.transcript || 'Voice intake recorded and verified.'}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setCallingState('idle');
                    setCallResult(null);
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setConfirmationAudioUrl(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Place Another Call
                </button>
                {onTrackTicket ? (
                  <button
                    onClick={() => onTrackTicket(callResult.ticketId)}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30"
                  >
                    <Search className="w-4 h-4" />
                    <span>Track Ticket Now</span>
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Virtual Helpline Banner (No Department Picker) */}
              <div className="p-4 bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300">
                    <Radio className="w-6 h-6 animate-pulse text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Universal Citizen Helpline</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        100% Local AI Stack
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white font-mono mt-0.5">1800-CIVICSENSE (1800-248-4273)</p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      No IVR options ("press 1 for water"). Just speak freely — our AI models transcribe and route to the correct municipal department automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Caller Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Your Phone Number (Caller Identity)
                </label>
                <input
                  type="text"
                  data-testid="caller-phone-input"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98400 11223"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Hidden file input for Playwright test fixture audio */}
              <input
                type="file"
                data-testid="fixture-audio-input"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setAudioBlob(file);
                    setAudioUrl(URL.createObjectURL(file));
                    setIsRecording(false);
                    setErrorMessage('');
                  }
                }}
              />

              {/* Audio Voice Input */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300">
                  Voice Call Simulation (Speak freely in English, Tamil, or Hindi)
                </label>
                
                <div 
                  data-testid="call-in-progress-waveform" 
                  className="p-5 bg-slate-800/40 border border-slate-700/80 rounded-2xl flex flex-col items-center justify-center gap-3"
                >
                  {isRecording ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center animate-ping absolute inset-0" />
                        <button
                          onClick={stopRecording}
                          className="relative w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 transition cursor-pointer"
                        >
                          <Square className="w-6 h-6" />
                        </button>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 animate-pulse">
                        Listening & Recording... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={startRecording}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        {audioBlob ? 'Record Again' : 'Speak into Microphone'}
                      </button>
                      <span className="text-xs text-slate-500 font-medium">or</span>
                      <button
                        data-testid="quick-test-sample-btn"
                        onClick={() => generateTestAudio("Simulated citizen grievance")}
                        className="px-4 py-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Quick Test Audio Sample
                      </button>
                    </div>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="w-full mt-2 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Voice Recording Ready ({recordingSeconds}s)</span>
                      </div>
                      <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
                    </div>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-testid="call-submit-btn"
                  onClick={handleSubmitCall}
                  disabled={callingState === 'calling'}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  {callingState === 'calling' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connecting & Transcribing...
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      Call CivicSense (1800-CIVICSENSE)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
