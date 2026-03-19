import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface PivotSimulatorProps {
  idea: IdeaInput;
  auditResult: any;
}

interface AssumptionDelta {
  assumption: string;
  riskBefore: string;
  riskAfter: string;
  reasoning: string;
}

interface SimulationRecord {
  id: string;
  timestamp: string;
  variables: {
    audience: string;
    pricing: string;
    channel: string;
    problemReframe: string;
    revenueModel: string;
  };
  result: {
    verdict: string;
    chainReactionOfFailure: string;
    ultimateBottleneck: string;
    newScore: number;
    delta: number;
    assumptionDeltas?: AssumptionDelta[];
  };
}

interface SuggestedPivot {
  name: string;
  rationale: string;
  variables: {
    audience: string;
    pricing: string;
    channel: string;
    problemReframe: string;
    revenueModel: string;
  };
}

export default function PivotSimulator({ idea, auditResult }: PivotSimulatorProps) {
  const [audience, setAudience] = useState(idea.targetAudience || '');
  const [pricing, setPricing] = useState(idea.targetPricing || '');
  const [channel, setChannel] = useState(idea.acquisitionChannel || '');
  const [problemReframe, setProblemReframe] = useState(idea.problem || '');
  const [revenueModel, setRevenueModel] = useState(idea.monetization || '');
  
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedPivot[] | null>(null);
  
  const [history, setHistory] = useState<SimulationRecord[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-pivot-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      // Auto-sort history by score desc so best pivots bubble to the top
      const sorted = [...history].sort((a, b) => b.result.newScore - a.result.newScore);
      localStorage.setItem('co-validator-pivot-history', JSON.stringify(sorted));
    }
  }, [history]);

  const loadSuggestion = (pivot: SuggestedPivot) => {
    setAudience(pivot.variables.audience);
    setPricing(pivot.variables.pricing);
    setChannel(pivot.variables.channel);
    setProblemReframe(pivot.variables.problemReframe);
    setRevenueModel(pivot.variables.revenueModel);
  };

  const getSuggestions = async () => {
    setSuggesting(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const res = await actions.getSuggestedPivots(
        JSON.stringify(idea),
        JSON.stringify({ verdict: auditResult.verdict, coreBet: auditResult.coreBet, assumptionStack: auditResult.criticalAssumptionStack }),
        token
      );
      if (res.result && res.result.pivots) {
        setSuggestions(res.result.pivots);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get suggestions.");
    } finally {
      setSuggesting(false);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const originalScore = Math.min(
        100,
        Math.max(
          10,
          Math.round((auditResult.validationScore || 50) * 0.4 + (auditResult.opportunityScore || 50) * 0.4 + (auditResult.confidenceScore || 50) * 0.2)
        )
      );

      const changeStr = `
        New Target Audience: ${audience}
        New Pricing: ${pricing}
        New Channel: ${channel}
        Problem Reframe: ${problemReframe}
        New Revenue Model: ${revenueModel}
      `;

      const auditSummary = `
        Original Score: ${originalScore}
        Verdict: ${auditResult.verdict}
        Stop Signal: ${auditResult.stopSignal}
      `;

      const res = await actions.stressTestSimulation(JSON.stringify(idea), changeStr, auditSummary, token);
      
      if (res.result) {
        const newRecord: SimulationRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          variables: { audience, pricing, channel, problemReframe, revenueModel },
          result: {
            verdict: res.result.verdict || 'Unknown',
            chainReactionOfFailure: res.result.chainReactionOfFailure || 'System logic omitted.',
            ultimateBottleneck: res.result.ultimateBottleneck || 'Unknown',
            newScore: res.result.newScore || originalScore,
            delta: (res.result.newScore || originalScore) - originalScore,
            assumptionDeltas: res.result.assumptionDeltas
          }
        };
        
        setHistory(prev => {
          const next = [newRecord, ...prev];
          return next.sort((a, b) => b.result.newScore - a.result.newScore);
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to run simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Pivot Lab</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Simulate business model changes instantly. Use the AI to generate pivot paths or manually tweak variables to see how your new logic holds up under stress. Best pivots auto-rank highest.
        </p>
      </div>

      {(!suggestions && history.length === 0) && (
        <div className="flex justify-center mb-8">
          <button 
            onClick={getSuggestions}
            disabled={suggesting}
            className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)] flex items-center gap-2"
          >
            {suggesting ? <span className="animate-spin">🤖</span> : '🤖'}
            {suggesting ? 'Analyzing Bottlenecks...' : 'Auto-Generate 3 AI Pivots'}
          </button>
        </div>
      )}

      {suggestions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up bg-blue-500/5 p-6 rounded-3xl border border-blue-500/20 mb-8">
          {suggestions.map((p, i) => (
            <div key={i} className="bg-black/60 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-blue-500/50 transition-colors">
              <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest">Option {i + 1}</span>
              <h4 className="text-lg font-bold text-white leading-tight">{p.name}</h4>
              <p className="text-xs text-blue-200/70">{p.rationale}</p>
              <button 
                onClick={() => loadSuggestion(p)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded font-bold text-xs transition-colors"
              >
                Load This Configuration
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Variables Form */}
        <div className="space-y-6 bg-black/40 border border-white/10 p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex justify-between items-center z-10 relative">
             <h3 className="text-xl font-black text-white tracking-widest uppercase">Dial In The Pivot</h3>
             {suggestions && (
                <button onClick={() => setSuggestions(null)} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-bold">Clear AI Suggestions</button>
             )}
          </div>

          <div className="space-y-5 relative z-10">
            <div>
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Problem Reframe</label>
              <textarea 
                rows={2}
                value={problemReframe}
                onChange={e => setProblemReframe(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Target Audience</label>
              <input 
                type="text" 
                value={audience}
                onChange={e => setAudience(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Pricing Strategy</label>
              <input 
                type="text" 
                value={pricing}
                onChange={e => setPricing(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Revenue Model</label>
              <input 
                type="text" 
                value={revenueModel}
                onChange={e => setRevenueModel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2 block">Acquisition Channel</label>
              <input 
                type="text" 
                value={channel}
                onChange={e => setChannel(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-white/30 outline-none transition-colors"
              />
            </div>

            <button 
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-4 mt-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              {loading ? 'Running Physics Engine...' : 'Simulate Pivot Dynamics'}
            </button>
          </div>
        </div>

        {/* Results Ranking */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
             <h3 className="text-xl font-black text-white tracking-widest uppercase mb-2">Simulation Ladder</h3>
             {history.length > 0 && (
               <button onClick={() => { setHistory([]); localStorage.removeItem('co-validator-pivot-history'); }} className="text-[10px] text-red-500/50 hover:text-red-500 uppercase tracking-wider font-bold mb-2">Clear Ladder</button>
             )}
          </div>
          
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 hide-scrollbar">
            {history.map((record, idx) => (
              <div key={record.id} className={`bg-black/40 border rounded-2xl p-6 ${idx === 0 ? 'border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/10'} transition-all`}>
                
                {/* Header Badge */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    {idx === 0 && <span className="text-xl" title="Highest Score">🏆</span>}
                    <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded ${
                      record.result.verdict === 'Greenlit' ? 'bg-green-500/10 text-green-400' : 
                      record.result.verdict === 'Pivot Required' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {record.result.verdict}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 text-right">
                    <span className="text-sm font-black text-gray-500">Score</span>
                    <span className="text-2xl font-black leading-none text-white">{record.result.newScore}</span>
                    <span className={`text-xs ml-1 font-bold ${record.result.delta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {record.result.delta > 0 ? '+' : ''}{record.result.delta}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">New Bottleneck</span>
                    <p className="text-sm text-gray-300 font-bold">{record.result.ultimateBottleneck}</p>
                  </div>
                  
                  {/* Assumption Deltas Table */}
                  {record.result.assumptionDeltas && record.result.assumptionDeltas.length > 0 && (
                    <div className="mt-4 border border-white/5 rounded-xl overflow-hidden bg-[#111]">
                      <div className="px-4 py-2 border-b border-white/5 bg-white/5">
                        <span className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Assumption Risk Shift</span>
                      </div>
                      <div className="divide-y divide-white/5">
                        {record.result.assumptionDeltas.map((ad, i) => (
                          <div key={i} className="p-3 text-xs flex gap-4 items-center">
                            <span className="flex-1 text-gray-300 truncate" title={ad.assumption}>{ad.assumption}</span>
                            <div className="flex items-center gap-2 shrink-0">
                               <span className="text-gray-500 w-8">{ad.riskBefore}</span>
                               <span className="text-gray-600">→</span>
                               <span className={`w-8 font-bold ${ad.riskAfter === 'Low' ? 'text-green-400' : ad.riskAfter === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>
                                 {ad.riskAfter}
                               </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 rounded">
                      Audience: {record.variables.audience}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 border border-white/10 px-2 py-1 rounded">
                      Price: {record.variables.pricing}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {history.length === 0 && (
              <div className="text-center p-12 border border-white/10 border-dashed rounded-3xl">
                <p className="text-gray-500 text-sm font-bold">Simulator is empty. Run a pivot to see outcomes.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
