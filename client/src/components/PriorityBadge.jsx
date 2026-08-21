import React from 'react';

export default function PriorityBadge({ priority }) {
  const getStyle = () => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300 font-bold uppercase tracking-wider animate-pulse';
      case 'HIGH':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'LOW':
        return 'bg-slate-100 text-slate-600 border-slate-200 font-medium';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${getStyle()}`}>
      {priority?.toUpperCase()}
    </span>
  );
}
