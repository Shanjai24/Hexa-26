import React, { useState } from 'react';
import { Layers, MapPin, Sparkles, Plus, CheckCircle2 } from 'lucide-react';

export default function IncidentDetectionView({ incidents, onSelectComplaint }) {
  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-600 uppercase">AI Clustering Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Incident & Duplicate Detection</h1>
          <p className="text-xs text-slate-500">Automatically aggregate isolated call grievances into high-impact municipal incidents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase px-1">Detected Incident Clusters</h3>
          {incidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedIncident.id === inc.id ? 'bg-blue-50 border-blue-500 shadow-md' : 'bg-white border-slate-200'
              }`}
            >
              <span className="font-mono text-xs font-bold text-blue-700">{inc.id}</span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">{inc.title}</h4>
              <p className="text-xs text-slate-500 mt-2">{inc.relatedComplaintsCount} Linked Complaints • {inc.location}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-5">
          {selectedIncident && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900">{selectedIncident.title} ({selectedIncident.id})</h2>
              <p className="text-xs text-slate-600 font-medium">"{selectedIncident.aiRationale}"</p>

              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 h-44 flex items-center justify-center">
                <span className="text-xs font-mono text-slate-400">Spatial Density Grid — {selectedIncident.location} ({selectedIncident.relatedComplaintsCount} Complaints)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
