import React, { useState } from 'react';
import { Cpu, Mic, MessageSquare, Globe, Tag, Layers, AlertCircle, Building, Sparkles, ShieldCheck } from 'lucide-react';

export default function LiveAiPipelineView() {
  const [activeStep, setActiveStep] = useState(7);

  const pipelineSteps = [
    { id: 0, label: 'VOICE RECEIVED', icon: Mic, time: '0.05s' },
    { id: 1, label: 'SPEECH TO TEXT', icon: MessageSquare, time: '0.12s' },
    { id: 2, label: 'LANGUAGE DETECTION', icon: Globe, time: '0.08s' },
    { id: 3, label: 'ENTITY EXTRACTION', icon: Tag, time: '0.15s' },
    { id: 4, label: 'CLASSIFICATION', icon: Cpu, time: '0.10s' },
    { id: 5, label: 'PRIORITY DETECTION', icon: AlertCircle, time: '0.06s' },
    { id: 6, label: 'DUPLICATE DETECTION', icon: Layers, time: '0.18s' },
    { id: 7, label: 'RECOMMENDATION', icon: Building, time: '0.04s' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-blue-400 uppercase">CivicSense AI Model Pipeline v4</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Live AI Call Processing Stream</h1>
        </div>
        <div className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-right">
          <span className="text-[10px] text-slate-400 block font-semibold">TOTAL LATENCY</span>
          <span className="text-sm font-mono font-bold text-emerald-400">0.78 seconds</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Neural Pipeline Visualizer</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            const isDone = step.id <= activeStep;
            return (
              <div 
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isDone ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900' : 'bg-slate-50 border-slate-200 opacity-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center bg-blue-600 text-white">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-[10px] font-extrabold truncate">{step.label}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-1">{step.time}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
