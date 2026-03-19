import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface AssumptionTrackerProps {
  idea: IdeaInput;
  auditResult: any;
  onRescoreComplete?: (newResult: any) => void;
}

const EVIDENCE_TYPES = [
  { value: 'revenue', label: 'Revenue Data', weight: '💰 Strongest' },
  { value: 'signup', label: 'Signup Metric', weight: '📊 Strong' },
  { value: 'interview', label: 'Interview Quote', weight: '🎙️ Moderate' },
  { value: 'survey', label: 'Survey Result', weight: '📋 Weak-Moderate' },
  { value: 'rejection', label: 'Rejection Signal', weight: '🔴 Negative' },
  { value: 'other', label: 'Other', weight: '❓ Context-dependent' },
] as const;

interface Evidence {
  text: string;
  type: string;
  date: string;
}

interface Assumption {
  id: string;
  text: string;
  status: 'unvalidated' | 'testing' | 'validated' | 'killed';
  confidence: number;
  evidence: Evidence[];
}

export default function AssumptionTracker({ idea, auditResult, onRescoreComplete }: AssumptionTrackerProps) {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(false);
  const [rescoreResult, setRescoreResult] = useState<any>(null);
  const [newEvidenceInput, setNewEvidenceInput] = useState<{ [id: string]: string }>({});
  const [newEvidenceType, setNewEvidenceType] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-assumptions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAssumptions(parsed);
        return;
      } catch (e) {}
    }

    if (auditResult?.criticalAssumptionStack) {
      const initial = auditResult.criticalAssumptionStack.map((item: any, i: number) => {
        const text = typeof item === 'string' ? item : (item.assumption || JSON.stringify(item));
        return {
          id: `assume-${i}`,
          text,
          status: 'unvalidated',
          confidence: 0,
          evidence: []
        };
      });
      setAssumptions(initial);
    }
  }, [auditResult]);

  useEffect(() => {
    if (assumptions.length > 0) {
      localStorage.setItem('co-validator-assumptions', JSON.stringify(assumptions));
    }
  }, [assumptions]);

  const calcConfidence = (evidence: Evidence[]): number => {
    if (evidence.length === 0) return 0;
    const weights: Record<string, number> = {
      revenue: 30, signup: 22, interview: 15, survey: 10, rejection: -15, other: 8
    };
    let score = 0;
    evidence.forEach(e => { score += weights[e.type] || 8; });
    return Math.max(0, Math.min(100, score));
  };

  const handleAddEvidence = (id: string) => {
    const text = newEvidenceInput[id]?.trim();
    const type = newEvidenceType[id] || 'other';
    if (!text) return;

    setAssumptions(prev => prev.map(a => {
      if (a.id === id) {
        const updatedEvidence = [...a.evidence, { text, type, date: new Date().toLocaleDateString() }];
        return {
          ...a,
          evidence: updatedEvidence,
          confidence: calcConfidence(updatedEvidence),
          status: a.status === 'unvalidated' ? 'testing' : a.status
        };
      }
      return a;
    }));

    setNewEvidenceInput(prev => ({ ...prev, [id]: '' }));
    setNewEvidenceType(prev => ({ ...prev, [id]: 'other' }));
  };

  const handleStatusChange = (id: string, newStatus: any) => {
    setAssumptions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const triggerRescore = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const evidenceLog = assumptions.map(a => ({
        assumption: a.text,
        status: a.status,
        confidence: a.confidence,
        evidence: a.evidence.map(e => ({ type: e.type, content: e.text }))
      }));

      const res = await actions.rescoreAudit(idea, auditResult, evidenceLog, token);
      if (res.result) {
        setRescoreResult(res.result);

        // Update per-assumption confidence from AI response
        if (res.result.confidencePerAssumption) {
          setAssumptions(prev => prev.map((a, i) => {
            const aiConf = res.result.confidencePerAssumption[i];
            return aiConf ? { ...a, confidence: aiConf.confidence } : a;
          }));
        }

        // Propagate to parent so the entire app reflects the new verdict
        if (onRescoreComplete) {
          onRescoreComplete({
            ...auditResult,
            verdict: res.result.newVerdict,
            coreBet: res.result.updatedCoreBet,
            criticalAssumptionStack: res.result.updatedAssumptions
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rescore.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => EVIDENCE_TYPES.find(t => t.value === type)?.label || type;
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      revenue: 'text-green-400', signup: 'text-blue-400', interview: 'text-yellow-400',
      survey: 'text-orange-400', rejection: 'text-red-400', other: 'text-gray-400'
    };
    return colors[type] || 'text-gray-400';
  };

  if (assumptions.length === 0) return <div className="text-center text-gray-500 py-20">No assumptions found in this audit.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Live Tracker</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Ideas aren't validated in Notion docs. They are validated in the market. Log structured field evidence against the critical assumption stack here.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {assumptions.map(a => (
          <div key={a.id} className="bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 space-y-4 flex-grow">
              {/* Header: Status + Confidence Ring + Dropdown */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-3">
                  {/* Confidence Ring */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                      <circle cx="22" cy="22" r="18" fill="none"
                        stroke={a.confidence >= 70 ? '#22c55e' : a.confidence >= 40 ? '#eab308' : '#ef4444'}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${(a.confidence / 100) * 113} 113`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
                      {a.confidence}
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${
                    a.status === 'validated' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    a.status === 'killed' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                    a.status === 'testing' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                    'bg-white/10 text-gray-400 border border-white/10'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <select
                  value={a.status}
                  onChange={(e) => handleStatusChange(a.id, e.target.value)}
                  className="bg-transparent text-xs text-gray-500 cursor-pointer outline-none hover:text-white transition-colors"
                >
                  <option value="unvalidated">Unvalidated</option>
                  <option value="testing">Testing</option>
                  <option value="validated">Validated</option>
                  <option value="killed">Killed</option>
                </select>
              </div>
              <p className="text-white font-bold leading-relaxed">{a.text}</p>

              {a.evidence.length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Evidence Log</span>
                  {a.evidence.map((ev, i) => (
                    <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm text-gray-300">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase ${getTypeColor(ev.type)}`}>{getTypeLabel(ev.type)}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-gray-600">{ev.date}</span>
                      </div>
                      {ev.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence Input */}
            <div className="p-4 bg-white/5 border-t border-white/10 space-y-2">
              <div className="flex gap-2">
                <select
                  value={newEvidenceType[a.id] || 'other'}
                  onChange={(e) => setNewEvidenceType(prev => ({ ...prev, [a.id]: e.target.value }))}
                  className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500/50"
                >
                  {EVIDENCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.weight} {t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Log evidence (e.g. '3 users pre-paid $50')..."
                  value={newEvidenceInput[a.id] || ''}
                  onChange={(e) => setNewEvidenceInput(prev => ({ ...prev, [a.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEvidence(a.id)}
                  className="flex-grow bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={() => handleAddEvidence(a.id)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs uppercase rounded-xl transition-all"
                >
                  Log
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto text-center space-y-6 pt-12 border-t border-white/10">
        <h3 className="text-2xl font-black text-white uppercase">Re-Score Audit</h3>
        <p className="text-gray-400 text-sm">
          Once you have gathered enough evidence, submit it to the AI for a re-scoring. It will determine if the Stop Signal has been cleared.
        </p>
        <button
          onClick={triggerRescore}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Analyzing Evidence...' : 'Submit Evidence & Re-Score'}
        </button>

        {rescoreResult && (
          <div className="mt-8 p-8 bg-black/60 border border-green-500/30 rounded-3xl animate-slide-up text-left space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] uppercase font-black text-green-400 tracking-widest block mb-1">New Verdict</span>
                <span className="text-3xl font-black text-white uppercase">{rescoreResult.newVerdict}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-black text-purple-400 tracking-widest block mb-2">Evidence Analysis</span>
              <p className="text-gray-300 leading-relaxed">{rescoreResult.evidenceAnalysis}</p>
            </div>
            {rescoreResult.confidencePerAssumption && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-2">Per-Assumption Confidence</span>
                {rescoreResult.confidencePerAssumption.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className={`text-lg font-black ${c.confidence >= 70 ? 'text-green-400' : c.confidence >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {c.confidence}%
                    </span>
                    <span className="text-xs text-gray-400">{c.reasoning}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-1">Updated Core Bet</span>
              <p className="text-lg text-white font-bold">"{rescoreResult.updatedCoreBet}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
