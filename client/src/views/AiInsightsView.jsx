import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AiInsightsView() {
  const cards = [
    { id: 1, type: 'PREDICTED ISSUE', title: 'Post-Rainfall Drainage Risk', zone: 'Zone 7', increase: '42%', text: 'Historical rainfall data correlated with recent 48-hour drainage complaint pattern.' },
    { id: 2, type: 'EMERGING ISSUE', title: 'Commercial Feeder Cable Degradation', zone: 'Zone 3', increase: '31%', text: 'Street light and transformer sparking complaints increased 31% over the last 5 days.' },
    { id: 3, type: 'RECURRING ISSUE', title: 'Weekly Water Supply Drop', zone: 'Zone 4', increase: '27%', text: 'Recurring pressure drops observed every Tuesday & Friday during peak morning hours.' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="text-xs font-bold text-blue-400 uppercase">Predictive Governance Core</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">AI Governance Intelligence Radar</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(c => (
          <div key={c.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded uppercase bg-blue-50 text-blue-700">{c.type}</span>
            <h3 className="text-base font-bold text-slate-900">{c.title} ({c.zone})</h3>
            <p className="text-xs text-slate-600 font-medium">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
