import React, { useState } from 'react';
import { Map, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function HeatmapAnalyticsView() {
  const zones = [
    { id: 'Zone 4', name: 'Anna Nagar', complaints: 184, increase: '+37%', risk: 'CRITICAL', color: 'bg-red-500' },
    { id: 'Zone 7', name: 'Velachery', complaints: 142, increase: '+24%', risk: 'HIGH', color: 'bg-orange-500' },
    { id: 'Zone 2', name: 'T Nagar', complaints: 110, increase: '+14%', risk: 'MEDIUM', color: 'bg-amber-500' },
    { id: 'Zone 3', name: 'Adyar', complaints: 95, increase: '+8%', risk: 'MEDIUM', color: 'bg-amber-500' },
    { id: 'Zone 1', name: 'Mylapore', complaints: 64, increase: '-5%', risk: 'LOW', color: 'bg-emerald-500' }
  ];

  const zoneChartData = zones.map(z => ({ name: z.name, count: z.complaints }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">City Grievance Spatial Heatmap</h1>
          <p className="text-xs text-slate-500">Real-time geospatial density analytics & predictive outbreak forecasting</p>
        </div>
      </div>

      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">Chennai Spatial Density Grid</h3>
        </div>
        <div className="h-72 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4">
          <span className="text-xs text-slate-400 font-mono">Anna Nagar (Zone 4) Hotspot Detected: 184 Water Complaints (+37%)</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase mb-3">Zone Intake Volume</h3>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={zoneChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
