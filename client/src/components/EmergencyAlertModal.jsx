import React from 'react';
import { Flame, MapPin, ShieldAlert, Radio, Phone, X, AlertTriangle } from 'lucide-react';

export default function EmergencyAlertModal({ isOpen, onClose, onDispatch }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-2xl border-2 border-red-500 shadow-2xl overflow-hidden emergency-pulse">
        {/* Banner Header */}
        <div className="bg-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-700 border border-red-400 flex items-center justify-center animate-bounce">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-800 text-red-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  SYSTEM LEVEL 1
                </span>
                <span className="text-xs text-red-100 font-mono">00:08 REMAINING</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white">CRITICAL EMERGENCY DETECTED</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-red-50/40 to-white">
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <h3 className="text-sm font-bold text-red-900 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              "Possible commercial building fire reported."
            </h3>
            <p className="text-xs text-red-700">
              AI Speech Analysis detected active distress call with high confidence fire keywords from industrial sector.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">LOCATION & ZONE</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>Ambattur Industrial Estate (Zone 5)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">RECOMMENDED DEPT</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span>Fire & Rescue Command</span>
              </div>
            </div>
          </div>

          {/* Transcript Snippet */}
          <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1">
              <span>DETECTED CALL TRANSCRIPTION (+91 99XXX 1029)</span>
              <span className="text-red-400 font-semibold">99% CONFIDENCE</span>
            </div>
            <p className="italic text-slate-300">
              "அம்பத்தூர் தொழில் பேட்டையில் உள்ள கட்டிடத்தில் அடர்ந்த புகை வருகிறது! உடனடியாக தீயணைப்பு வண்டியை அனுப்புங்கள்!"
            </p>
            <p className="text-[11px] text-slate-400 mt-1 border-t border-slate-800 pt-1">
              English Translation: "Thick black smoke emerging from commercial building in Ambattur Industrial Estate! Send fire tender immediately!"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                onDispatch();
                onClose();
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              DISPATCH FIRE UNIT NOW
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              ESCALATE TO HQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
