import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Info, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

/**
 * Feature 11 — Explainable-AI Panel
 * Shows which TF-IDF terms most drove the category and urgency predictions,
 * using coefficient × feature-weight attribution from the trained Logistic Regression.
 *
 * Props:
 *   transcript       — raw complaint text (used for live fetch fallback)
 *   category         — predicted category label
 *   urgency          — predicted urgency label
 *   storedExplanation — pre-computed JSON from classificationExplanation field (skips API call)
 */
export default function XAIPanel({ transcript, category, urgency, storedExplanation = null }) {
  const [expanded, setExpanded] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If storedExplanation was passed (computed at creation time), use it immediately
    if (storedExplanation && (storedExplanation.category || storedExplanation.urgency)) {
      setExplanation(storedExplanation);
      return;
    }
    if (!expanded || !transcript) return;
    if (explanation) return; // already loaded

    async function fetchExplanation() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.explainClassification(transcript, 6);
        if (res?.category || res?.urgency) {
          setExplanation(res);
        } else {
          setError('Explanation unavailable for this transcript.');
        }
      } catch (err) {
        setError('Could not reach the AI explanation service.');
      } finally {
        setLoading(false);
      }
    }
    fetchExplanation();
  }, [expanded, transcript, storedExplanation]);

  // Normalize weights to 0-100% for bar widths
  const makeBar = (terms) => {
    if (!terms || terms.length === 0) return [];
    const maxAbs = Math.max(...terms.map(t => Math.abs(t.weight)), 0.001);
    return terms.map(t => ({
      ...t,
      pct: Math.round((Math.abs(t.weight) / maxAbs) * 100),
      positive: t.weight > 0
    }));
  };

  const categoryTerms = explanation ? makeBar(explanation.category?.topTerms) : [];
  const urgencyTerms  = explanation ? makeBar(explanation.urgency?.topTerms) : [];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.06) 100%)',
      border: '1px solid rgba(139,92,246,0.25)',
      borderRadius: '14px',
      overflow: 'hidden',
      margin: '16px 0'
    }}>
      {/* Header — always visible */}
      <button
        id="xai-panel-toggle"
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          textAlign: 'left'
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '8px',
          background: 'rgba(139,92,246,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Sparkles size={16} color="#a78bfa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.5px' }}>
            WHY DID THE AI DECIDE THIS?
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            TF-IDF × Logistic Regression attribution — click to expand
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '20px',
          background: 'rgba(139,92,246,0.15)',
          fontSize: '11px', fontWeight: 600, color: '#a78bfa'
        }}>
          {category || 'Category'} • {urgency || 'Urgency'}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div style={{ padding: '0 18px 18px' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', color: '#94a3b8', fontSize: '13px' }}>
              <div className="spin-sm" style={{
                width: 16, height: 16, border: '2px solid rgba(139,92,246,0.3)',
                borderTop: '2px solid #a78bfa', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }} />
              Computing feature attributions…
            </div>
          )}

          {error && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '13px', padding: '8px 0' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {explanation && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '4px' }}>
              <TermBlock
                title={`Category → ${explanation.category?.predicted || category}`}
                terms={categoryTerms}
                color="#a78bfa"
                lowConfidence={explanation.category?.lowConfidence}
              />
              <TermBlock
                title={`Urgency → ${explanation.urgency?.predicted || urgency}`}
                terms={urgencyTerms}
                color="#34d399"
                lowConfidence={explanation.urgency?.lowConfidence}
              />
            </div>
          )}

          {/* Methodology note */}
          {explanation && (
            <div style={{
              marginTop: '12px', padding: '8px 12px',
              background: 'rgba(148,163,184,0.06)', borderRadius: '8px',
              display: 'flex', gap: '6px', alignItems: 'flex-start'
            }}>
              <Info size={12} color="#64748b" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                Each bar shows <strong style={{ color: '#94a3b8' }}>TF-IDF weight × classifier coefficient</strong> for
                that term in the transcript. Longer bar = stronger push toward the predicted class.
                Green bars support the prediction; red bars oppose it.
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function TermBlock({ title, terms, color, lowConfidence }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 700, color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
        {lowConfidence && (
          <span style={{
            marginLeft: '6px', fontSize: '10px', fontWeight: 500,
            color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
            padding: '1px 6px', borderRadius: '10px'
          }}>low confidence</span>
        )}
      </div>
      {terms.length === 0 ? (
        <p style={{ fontSize: '12px', color: '#64748b' }}>No strong signal terms found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {terms.map((t, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                  {t.term}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {t.weight > 0 ? '+' : ''}{t.weight.toFixed(3)}
                </span>
              </div>
              <div style={{
                height: '4px', borderRadius: '2px',
                background: 'rgba(255,255,255,0.05)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${t.pct}%`, height: '100%',
                  background: t.positive ? color : '#f87171',
                  borderRadius: '2px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
