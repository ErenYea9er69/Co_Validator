import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface PivotSimulatorProps {
  idea: IdeaInput;
  auditResult: any;
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
  };
}

export default function PivotSimulator({ idea, auditResult }: PivotSimulatorProps) {
  const [audience, setAudience] = useState(idea.targetAudience || '');
  const [pricing, setPricing] = useState(idea.targetPricing || '');
  const [channel, setChannel] = useState(idea.acquisitionChannel || '');
  const [problemReframe, setProblemReframe] = useState(idea.problem || '');
  const [revenueModel, setRevenueModel] = useState(idea.monetization || '');
  
  const [loading, setLoading] = useState(false);
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
      localStorage.setItem('co-validator-pivot-history', JSON.stringify(history));
    }
  }, [history]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const pivotDescription = `Pivot the target audience to "${audience}". Change pricing to "${pricing}". Shift acquisition to "${channel}". Reframe problem as "${problemReframe}". Change revenue model to "${revenueModel}".`;
      
      const summary = {
        assumptions: auditResult.criticalAssumptionStack,
        reasoning: auditResult.reasoning,
        originalScore: auditResult.validationScore || 65
      };
      
      const res = await actions.runStressTest(idea, pivotDescription, summary, token);
      if (res.result) {
        const originalScore = summary.originalScore;
        const newScore = res.result.newScore || 50; 
        const delta = newScore - originalScore;

        const record: SimulationRecord = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          variables: { audience, pricing, channel, problemReframe, revenueModel },
          result: {
            verdict: res.result.verdict,
            chainReactionOfFailure: res.result.chainReactionOfFailure || res.result.chainReaction || res.result.analysis || "No detail.",
            ultimateBottleneck: res.result.ultimateBottleneck || res.result.newBottleneck || "Execution risk.",
            newScore,
            delta
          }
        };
        setHistory(prev => [record, ...prev]);
      }
    } catch (err) {
      console.error(err);
      alert("Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Pivot Lab</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Turn the dials on your business model. Stress test how changing your audience, pricing, or problem framing affects your viability score.
        </p>
      </div>

      {/* Input Panel */}
      <div className="bg-black/40 border border-white/10 rounded-3xl p-8 space-y-8 shadow-2xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Problem Reframe</label>
            <textarea 
              rows={2}
              value={problemReframe} 
              onChange={(e) => setProblemReframe(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Target Audience</label>
            <input 
              type="text" 
              value={audience} 
              onChange={(e) => setAudience(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Revenue Model</label>
            <input 
              type="text" 
              value={revenueModel} 
              onChange={(e) => setRevenueModel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Pricing Model</label>
            <input 
              type="text" 
              value={pricing} 
              onChange={(e) => setPricing(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Acq. Channel</label>
            <input 
              type="text" 
              value={channel} 
              onChange={(e) => setChannel(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
            >
              {loading ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Simulation History</h3>
            <button 
              onClick={() => { if (confirm("Clear history?")) setHistory([]); }}
              className="text-[10px] text-gray-600 uppercase font-black hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-4 text-[10px] uppercase font-black text-gray-500">Pivot Strategy</th>
                  <th className="p-4 text-[10px] uppercase font-black text-gray-500">Score Delta</th>
                  <th className="p-4 text-[10px] uppercase font-black text-gray-500">Verdict</th>
                  <th className="p-4 text-[10px] uppercase font-black text-gray-500">New Bottleneck</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="text-sm font-bold text-white mb-1">AUD: {record.variables.audience}</div>
                      <div className="text-[10px] text-gray-500">PROB: {record.variables.problemReframe.substring(0, 50)}...</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">{record.result.newScore}</span>
                        <span className={`text-[10px] font-black ${record.result.delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {record.result.delta >= 0 ? '↑' : '↓'}{Math.abs(record.result.delta)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                        record.result.verdict === 'Greenlit' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {record.result.verdict}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-gray-400">{record.result.ultimateBottleneck}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
