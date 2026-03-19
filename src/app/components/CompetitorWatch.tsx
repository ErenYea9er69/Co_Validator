import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface CompetitorWatchProps {
  idea: IdeaInput;
  rawData: any;
}

interface CompetitorIntel {
  name: string;
  moat: string;
  weakness: string;
  status: 'Threat Level Increased' | 'Threat Level Decreased' | 'No Meaningful Change' | 'Unknown';
  intelSummary: string;
  newFeaturesOrPricing: string;
  fundingOrMNA: string;
  lastChecked: string;
}

export default function CompetitorWatch({ idea, rawData }: CompetitorWatchProps) {
  const [competitors, setCompetitors] = useState<CompetitorIntel[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  useEffect(() => {
    // 1. Try to load saved intel from localStorage
    const saved = localStorage.getItem('co-validator-competitor-intel');
    if (saved) {
      try {
        setCompetitors(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    // 2. Otherwise extract from rawData.p2 (validateCompetitors)
    const p2Result = rawData?.p2?.result;
    if (p2Result?.directCompetitors && Array.isArray(p2Result.directCompetitors)) {
      const initial = p2Result.directCompetitors.map((c: any) => ({
        name: c.name || 'Unknown',
        moat: c.moat || 'Unknown',
        weakness: c.weakness || 'Unknown',
        status: 'Unknown',
        intelSummary: 'Click "Refresh Intel" to run a live web search for recent changes.',
        newFeaturesOrPricing: 'Unknown',
        fundingOrMNA: 'Unknown',
        lastChecked: 'Never'
      }));
      setCompetitors(initial);
    }
  }, [rawData]);

  useEffect(() => {
    if (competitors.length > 0) {
      localStorage.setItem('co-validator-competitor-intel', JSON.stringify(competitors));
    }
  }, [competitors]);

  const refreshIntel = async (index: number) => {
    setLoadingIndex(index);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const comp = competitors[index];
      const res = await actions.refreshCompetitorIntel(comp.name, idea.industry || 'Tech', token);
      
      if (res.result) {
        setCompetitors(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            status: res.result.status || 'Unknown',
            intelSummary: res.result.intelSummary || 'No summary available.',
            newFeaturesOrPricing: res.result.newFeaturesOrPricing || 'None found',
            fundingOrMNA: res.result.fundingOrMNA || 'None found',
            lastChecked: new Date().toLocaleString()
          };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to refresh competitor intel.");
    } finally {
      setLoadingIndex(null);
    }
  };

  if (competitors.length === 0) {
    return <div className="text-center text-gray-500 py-20">No competitors found in the audit raw data.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Competitor Intel</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Startups don't operate in a vacuum. Monitor your "Boss Competitors" for live feature launches, pricing changes, or funding rounds.
        </p>
      </div>

      <div className="space-y-6">
        {competitors.map((comp, i) => (
          <div key={i} className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col md:flex-row">
            {/* Sidebar info */}
            <div className="p-6 md:w-1/3 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{comp.name}</h3>
                <div className="space-y-4 mt-6">
                  <div>
                    <span className="text-[10px] uppercase font-black text-red-400 tracking-widest block mb-1">Their Moat</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{comp.moat}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-green-400 tracking-widest block mb-1">Their Weakness</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{comp.weakness}</p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <button 
                  onClick={() => refreshIntel(i)}
                  disabled={loadingIndex !== null}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  {loadingIndex === i ? 'Searching Web...' : 'Refresh Intel'}
                </button>
                <div className="text-center mt-2">
                  <span className="text-[9px] text-gray-500 uppercase">Last Checked: {comp.lastChecked}</span>
                </div>
              </div>
            </div>

            {/* Live Intel Panel */}
            <div className="p-6 md:w-2/3 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">Live Intel Synthesis</span>
                  <span className={`px-4 py-1 text-xs font-black uppercase rounded-full border ${
                    comp.status === 'Threat Level Increased' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    comp.status === 'Threat Level Decreased' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    comp.status === 'Unknown' ? 'bg-white/5 text-gray-400 border-white/10' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {comp.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className={`text-sm leading-relaxed ${comp.intelSummary.startsWith('Click') ? 'text-gray-500 italic' : 'text-white'}`}>
                  {comp.intelSummary}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-2">Product & Pricing</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{comp.newFeaturesOrPricing}</p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-orange-400 tracking-widest block mb-2">Funding & M&A</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{comp.fundingOrMNA}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
