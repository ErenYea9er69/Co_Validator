import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface AssumptionTrackerProps {
  idea: IdeaInput;
  auditResult: any;
  onRescoreComplete?: (newResult: any) => void;
}

const EVIDENCE_TYPES = [
  { value: 'revenue', label: 'Revenue Data', baseWeight: 35, icon: '💰' },
  { value: 'signup', label: 'Signup Metric', baseWeight: 20, icon: '📊' },
  { value: 'interview', label: 'Interview Quote', baseWeight: 10, icon: '🎙️' },
  { value: 'survey', label: 'Survey Result', baseWeight: 5, icon: '📋' },
  { value: 'rejection', label: 'Rejection Signal', baseWeight: -15, icon: '🔴' },
  { value: 'other', label: 'Other', baseWeight: 5, icon: '❓' },
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
  aiSuggestion?: {
    nextBestTest: string;
    whyItMatters: string;
  };
}

export default function AssumptionTracker({ idea, auditResult, onRescoreComplete }: AssumptionTrackerProps) {
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestingForId, setSuggestingForId] = useState<string | null>(null);
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
      const initial = auditResult.criticalAssumptionStack.map((a: any, i: number) => ({
        id: `assump-${i}`,
        text: typeof a === 'string' ? a : a.assumption || a.text,
        status: 'unvalidated',
        confidence: 0,
        evidence: []
      }));
      setAssumptions(initial);
    }
  }, [auditResult]);

  useEffect(() => {
    if (assumptions.length > 0) {
      localStorage.setItem('co-validator-assumptions', JSON.stringify(assumptions));
    }
  }, [assumptions]);

  const calcConfidenceWithDiminishingReturns = (evidence: Evidence[]): number => {
    let conf = 0;
    const counts: Record<string, number> = {};
    
    // Sort chronological mostly so earlier evidence gets full weight
    const sortedEvidence = [...evidence].reverse(); // oldest first roughly if added sequentially

    for (const e of sortedEvidence) {
      const typeDef = EVIDENCE_TYPES.find(t => t.value === e.type);
      if (!typeDef) continue;
      
      counts[e.type] = (counts[e.type] || 0) + 1;
      const count = counts[e.type];
      
      // Diminishing returns: 100% -> 50% -> 25% -> 10%
      let multiplier = 1;
      if (count === 2) multiplier = 0.5;
      if (count === 3) multiplier = 0.25;
      if (count >= 4) multiplier = 0.1;
      
      conf += typeDef.baseWeight * multiplier;
    }

    return Math.max(0, Math.min(100, Math.round(conf)));
  };

  const addEvidence = (id: string) => {
    const text = newEvidenceInput[id];
    const type = newEvidenceType[id] || 'other';
    if (!text || !text.trim()) return;

    setAssumptions(prev => prev.map(a => {
      if (a.id === id) {
        const newEvidenceList = [{ text, type, date: new Date().toISOString() }, ...a.evidence];
        const newConf = calcConfidenceWithDiminishingReturns(newEvidenceList);
        return {
          ...a,
          evidence: newEvidenceList,
          confidence: newConf,
          status: newConf > 75 ? 'validated' : newConf < 20 && newEvidenceList.length > 2 ? 'killed' : 'testing'
        };
      }
      return a;
    }));

    setNewEvidenceInput(prev => ({ ...prev, [id]: '' }));
    setNewEvidenceType(prev => ({ ...prev, [id]: 'revenue' }));
  };

  const requestSuggestion = async (id: string) => {
    const assumption = assumptions.find(a => a.id === id);
    if (!assumption) return;

    setSuggestingForId(id);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const res = await actions.getEvidenceSuggestion(
        { text: assumption.text, status: assumption.status, confidence: assumption.confidence },
        assumption.evidence,
        token
      );
      
      if (res.result) {
        setAssumptions(prev => prev.map(a => 
          a.id === id ? { ...a, aiSuggestion: res.result } : a
        ));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get suggestion.");
    } finally {
      setSuggestingForId(null);
    }
  };

  const runRescore = async () => {
    setLoading(true);
    setRescoreResult(null);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      
      const evidenceLog = assumptions.map(a => ({
        assumption: a.text,
        evidence: a.evidence.map(e => `[${e.type}] ${e.text} (${new Date(e.date).toLocaleDateString()})`).join(' | ') || 'None'
      }));

      const res = await actions.rescoreAudit(idea, auditResult, evidenceLog, token);
      if (res.result) {
        setRescoreResult(res.result);
        if (res.result.confidencePerAssumption) {
          setAssumptions(prev => prev.map(a => {
            const aiData = res.result.confidencePerAssumption.find((ca: any) => 
              a.text.includes(ca.assumption) || ca.assumption.includes(a.text)
            );
            if (aiData) {
              return { ...a, confidence: aiData.confidence };
            }
            return a;
          }));
        }
        if (onRescoreComplete) {
          onRescoreComplete({ ...auditResult, verdict: res.result.newVerdict, coreBet: res.result.updatedCoreBet, evidenceStatus: 'rescored' });
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to re-score audit.");
    } finally {
      setLoading(false);
    }
  };

  const clearRecords = () => {
    if (confirm("Reset all validation records?")) {
      localStorage.removeItem('co-validator-assumptions');
      window.location.reload();
    }
  };

  const CircularProgress = ({ value }: { value: number }) => {
    const safeValue = isNaN(Number(value)) ? 0 : Number(value);
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safeValue / 100) * circumference;
    const color = safeValue > 75 ? 'text-green-500' : safeValue > 40 ? 'text-yellow-500' : 'text-red-500';
    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/10" />
          <circle 
            cx="32" cy="32" r={radius} 
            stroke="currentColor" strokeWidth="6" fill="transparent" 
            strokeDasharray={circumference} strokeDashoffset={offset} 
            strokeLinecap="round" className={`${color} transition-all duration-1000 ease-out`} 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xs font-black text-white">{Math.round(safeValue)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Live Tracker</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Ideas are guilty until proven innocent. Log structured evidence against your critical assumptions. The algorithm uses diminishing returns — 3 surveys matter less than 1 sale.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <button 
            onClick={runRescore}
            disabled={loading}
            className="px-8 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
          >
            {loading ? 'Auditing Evidence...' : 'Re-Score Master Audit'}
          </button>
          <button onClick={clearRecords} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase rounded-xl transition-all">
            Clear Logs
          </button>
        </div>
      </div>

      {rescoreResult && (
        <div className="bg-black border border-white/20 p-8 rounded-2xl animate-slide-up shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <h3 className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Re-Score Analysis</h3>
            <div className="flex items-center gap-4">
              <span className={`px-4 py-2 text-xs font-black uppercase rounded border tracking-widest ${
                rescoreResult.newVerdict === 'Greenlit for Testing' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                rescoreResult.newVerdict === 'Pivot Required' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                Verdict: {rescoreResult.newVerdict}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-300 italic p-4 bg-white/5 rounded-xl border border-white/5">
              "{rescoreResult.evidenceAnalysis}"
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {assumptions.map((assump) => (
          <div key={assump.id} className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all focus-within:border-white/30 shadow-xl">
            {/* Header Area */}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
              <CircularProgress value={assump.confidence} />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${
                    assump.status === 'validated' ? 'bg-green-500/20 text-green-400' :
                    assump.status === 'killed' ? 'bg-red-500/20 text-red-400' :
                    assump.status === 'testing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {assump.status}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">Log Count: {assump.evidence.length}</span>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{assump.text}</h3>
              </div>
            </div>
            
            <div className="px-6 md:px-8 pb-6 border-b border-white/5">
               {/* Timeline Viusalization */}
              {assump.evidence.length > 0 && (
                <div className="flex gap-2 items-center mb-6 overflow-x-auto hide-scrollbar">
                  <span className="text-[9px] uppercase font-black text-gray-600 tracking-widest shrink-0 mr-2">Timeline</span>
                  {assump.evidence.map((e, idx) => (
                    <div key={idx} className="flex flex-col items-center group shrink-0 relative">
                      <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-blue-400 transition-colors" />
                      <div className="h-0.5 w-4 bg-white/5 my-1" />
                      <span className="text-[8px] text-gray-600">{new Date(e.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</span>
                    </div>
                  ))}
                  <div className="h-0.5 flex-1 bg-white/5 ml-2" />
                </div>
              )}

              {/* Input Area */}
              <div className="flex flex-col md:flex-row gap-3">
                <select 
                  value={newEvidenceType[assump.id] || ''}
                  onChange={(e) => setNewEvidenceType(prev => ({ ...prev, [assump.id]: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-xs text-white uppercase font-bold tracking-wider outline-none focus:border-blue-500"
                >
                  <option value="" disabled>Select Evidence Type</option>
                  {EVIDENCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
                <div className="flex-1 flex gap-2">
                  <input 
                    type="text" 
                    value={newEvidenceInput[assump.id] || ''} 
                    onChange={(e) => setNewEvidenceInput(prev => ({ ...prev, [assump.id]: e.target.value }))}
                    placeholder="e.g., '15 users paid $10 deposit...'"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && addEvidence(assump.id)}
                  />
                  <button 
                    onClick={() => addEvidence(assump.id)}
                    disabled={!newEvidenceInput[assump.id]}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
                  >
                    Log
                  </button>
                </div>
              </div>
            </div>

            {/* AI Suggestion Area */}
            {assump.aiSuggestion ? (
              <div className="bg-blue-500/10 border-t border-blue-500/20 p-6 flex gap-4 items-start">
                <span className="text-2xl mt-1">🤖</span>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block">AI Strategy Suggestion</span>
                  <p className="text-sm font-bold text-white leading-relaxed">{assump.aiSuggestion.nextBestTest}</p>
                  <p className="text-xs text-blue-200/60">{assump.aiSuggestion.whyItMatters}</p>
                  <button onClick={() => setAssumptions(prev => prev.map(a => a.id === assump.id ? { ...a, aiSuggestion: undefined } : a))} className="text-[10px] text-blue-400 hover:underline mt-2">Dismiss</button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border-t border-white/5 px-6 py-3 flex justify-between items-center">
                <span className="text-[10px] text-gray-500 font-bold">Stuck on proving this?</span>
                <button 
                  disabled={suggestingForId === assump.id}
                  onClick={() => requestSuggestion(assump.id)} 
                  className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                  {suggestingForId === assump.id ? 'Thinking...' : '⚡ Suggest Next Test'}
                </button>
              </div>
            )}

            {/* Evidence Log List */}
            {assump.evidence.length > 0 && (
              <div className="p-6 bg-black/60 border-t border-white/5">
                <div className="space-y-3">
                  {assump.evidence.map((e, idx) => {
                    const typeDef = EVIDENCE_TYPES.find(t => t.value === e.type);
                    return (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex flex-col items-center gap-1 min-w-[32px]">
                          <span className="text-xl" title={typeDef?.label}>{typeDef?.icon || '❓'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-black text-white/50">{typeDef?.label || e.type}</span>
                            <span className="text-[9px] text-gray-600 bg-black/40 px-1.5 py-0.5 rounded">{new Date(e.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed break-words">{e.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
