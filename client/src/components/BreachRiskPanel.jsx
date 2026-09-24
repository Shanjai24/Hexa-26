import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, TrendingUp, Clock, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { api } from '../services/api.js';

/**
 * Feature 12 — SLA Breach Risk Panel
 * Shows which active complaints are predicted to breach their SLA,
 * with factor-level explanations from the local Logistic Regression model.
 *
 * Props:
 *   complaints — array of formatted complaint objects from getComplaints()
 *   onSelectComplaint — callback to open the complaint detail view
 */
export default function BreachRiskPanel({ complaints = [], onSelectComplaint }) {
  const [atRiskList, setAtRiskList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [expandedFactors, setExpandedFactors] = useState({});
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Breach risk is routed through the Node backend (api.getBreachRiskBatch → /api/ai/breach-risk-batch)

  const fetchBreachRisk = useCallback(async () => {
    if (!complaints || complaints.length === 0) return;

    // Only send active (non-resolved/closed) complaints
    const active = complaints.filter(c => {
      const s = (c.status || '').toLowerCase();
      return !s.includes('resolved') && !s.includes('closed') && !s.includes('rejected');
    });

    if (active.length === 0) {
      setAtRiskList([]);
      return;
    }

    setLoading(true);
    try {
      // Build payload with necessary features for breach prediction
      const payload = active.map(c => ({
        complaintId: c.dbId || c.id,
        ticketId: c.id,
        urgencyScore: c.urgencyScore || 50,
        departmentBreachRate: 0.25, // Realistic default; production would query historical stats
        officerWorkload: 3,         // Default; production would fetch officer's active count
        createdAt: c.createdAt || new Date(Date.now() - 3 * 3600000).toISOString(),
        priority: c.priority || 'HIGH',
        hasBeenReassigned: c.hasBeenReassigned || false,
        department: c.department
      }));

      const data = await api.getBreachRiskBatch(payload);

      if (data && data.atRisk && Array.isArray(data.atRisk)) {
        // Enrich with complaint details
        const enriched = data.atRisk.map(r => {
          const cmp = active.find(c => (c.dbId || c.id) === r.complaintId || c.id === r.ticketId);
          return { ...r, complaintDetails: cmp };
        });
        setAtRiskList(enriched);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[BreachRiskPanel] Failed to fetch breach risk:', err);
    } finally {
      setLoading(false);
    }
  }, [complaints]);

  useEffect(() => {
    fetchBreachRisk();
  }, [fetchBreachRisk]);

  if (atRiskList.length === 0 && !loading) return null;

  const riskColor = (score) => {
    if (score >= 0.75) return { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#ef4444', label: 'HIGH RISK' };
    if (score >= 0.55) return { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#f59e0b', label: 'AT RISK' };
    return { bg: 'rgba(148,163,184,0.1)', border: '#64748b', text: '#94a3b8', label: 'WATCH' };
  };

  const factorLabel = {
    urgencyScore: 'Urgency Score',
    departmentBreachRate: 'Dept. Breach History',
    officerWorkload: 'Officer Workload',
    hoursElapsed: 'Hours Elapsed',
    hasBeenReassigned: 'Was Reassigned'
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(245,158,11,0.05) 100%)',
      border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: '14px',
      marginBottom: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={15} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5', letterSpacing: '0.5px' }}>
              ⚠️ SLA BREACH RISK PREDICTION
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {atRiskList.length} ticket{atRiskList.length !== 1 ? 's' : ''} at risk — Local ML Model (Logistic Regression)
              {lastRefreshed && (
                <span style={{ marginLeft: '8px', color: '#64748b' }}>
                  · refreshed {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            id="breach-risk-refresh"
            onClick={fetchBreachRisk}
            disabled={loading}
            title="Refresh breach predictions"
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', padding: '6px 8px', cursor: 'pointer', color: '#ef4444'
            }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            id="breach-risk-toggle"
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#ef4444',
              fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Risk cards */}
      {expanded && (
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>
              Computing breach risk for all active tickets…
            </div>
          )}
          {atRiskList.map((item, idx) => {
            const colors = riskColor(item.breachRiskScore);
            const cmp = item.complaintDetails || {};
            const isFactorsExpanded = expandedFactors[item.complaintId];

            return (
              <div key={item.complaintId || idx} style={{
                background: colors.bg,
                border: `1px solid ${colors.border}40`,
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: colors.text,
                      background: `${colors.border}20`, padding: '2px 8px', borderRadius: '20px',
                      letterSpacing: '0.5px'
                    }}>
                      {colors.label}
                    </span>
                    <button
                      id={`breach-open-${item.ticketId}`}
                      onClick={() => cmp && onSelectComplaint && onSelectComplaint(cmp)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '13px', fontWeight: 700, color: '#e2e8f0'
                      }}
                    >
                      {item.ticketId || item.complaintId}
                    </button>
                    {cmp.category && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>— {cmp.category}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: colors.text, fontFamily: 'monospace' }}>
                        {Math.round(item.breachRiskScore * 100)}%
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>breach prob.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b' }}>
                      <Clock size={11} />
                      {item.hoursRemaining?.toFixed(1)}h left
                    </div>
                    <button
                      onClick={() => setExpandedFactors(prev => ({ ...prev, [item.complaintId]: !prev[item.complaintId] }))}
                      style={{
                        background: 'none', border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: '6px', padding: '3px 8px', cursor: 'pointer',
                        fontSize: '10px', color: '#94a3b8'
                      }}
                    >
                      {isFactorsExpanded ? 'Hide' : 'Why?'}
                    </button>
                  </div>
                </div>

                {/* Factor breakdown */}
                {isFactorsExpanded && item.factors && item.factors.length > 0 && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>
                      RISK FACTORS (coefficient × feature value)
                    </div>
                    {item.factors.slice(0, 4).map((f, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          {factorLabel[f.factor] || f.factor}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '80px', height: '4px', borderRadius: '2px',
                            background: 'rgba(255,255,255,0.05)', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, Math.abs(f.contribution) * 150)}%`,
                              height: '100%',
                              background: f.contribution > 0 ? '#ef4444' : '#34d399',
                              borderRadius: '2px'
                            }} />
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', width: '50px', textAlign: 'right' }}>
                            {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: '6px', fontSize: '10px', color: '#475569' }}>
                      Red bars increase breach risk · Green bars reduce it
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
