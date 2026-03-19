import React, { useState } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface PivotSimulatorProps {
  idea: IdeaInput;
  auditResult: any;
}

export default function PivotSimulator({ idea, auditResult }: PivotSimulatorProps) {
  const [audience, setAudience] = useState(idea.targetAudience || 'SMBs');
  const [pricing, setPricing] = useState(idea.targetPricing || '$50/mo');
  const [channel, setChannel] = useState(idea.acquisitionChannel || 'Inbound Content');
  
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    setSimulationResult(null);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const pivotDescription = `Pivot the target audience to ${audience}. Change pricing model to ${pricing}. Shift acquisition channel to ${channel}.`;
      
      const summary = {
        assumptions: auditResult.criticalAssumptionStack,
        reasoning: auditResult.reasoning
      };
      
      const res = await actions.runStressTest(idea, pivotDescription, summary, token);
      if (res.result) {
        setSimulationResult(res.result);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to run pivot simulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Pivot Lab</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Turn the dials on your business model. See how changing your audience, pricing, or channel affects your viability score in real-time.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Target Audience</label>
          <input 
            type="text" 
            value={audience} 
            onChange={(e) => setAudience(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Pricing Model</label>
          <input 
            type="text" 
            value={pricing} 
            onChange={(e) => setPricing(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <label className="text-[10px] uppercase font-black tracking-widest text-gray-500 block">Acq. Channel</label>
          <input 
            type="text" 
            value={channel} 
            onChange={(e) => setChannel(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={runSimulation}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all"
        >
          {loading ? 'Simulating Market Reaction...' : 'Inject Pivot & Simulate Test'}
        </button>
      </div>

      {simulationResult && (
        <div className="mt-12 bg-white/5 border border-white/10 rounded-3xl p-8 animate-slide-up">
          <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 block mb-2">Simulation Result</span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{simulationResult.verdict}</h3>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 block mb-2">Chain Reaction</span>
              <p className="text-gray-300 leading-relaxed text-sm">
                {simulationResult.chainReactionOfFailure || simulationResult.chainReaction || simulationResult.analysis || "No detailed chain reaction provided."}
              </p>
            </div>
            
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] uppercase font-black tracking-widest text-red-500 block mb-2">New Bottleneck</span>
              <p className="text-white text-sm font-bold">
                {simulationResult.ultimateBottleneck || simulationResult.newBottleneck || "The bottleneck simply shifted to execution."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
