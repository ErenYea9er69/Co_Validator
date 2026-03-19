import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface CompetitorWatchProps {
  idea: IdeaInput;
  rawData: any;
}

type ThreatStatus = 'Threat Level Increased' | 'Threat Level Decreased' | 'No Meaningful Change' | 'Unknown';

interface PricingTier {
  tier: string;
  price: string;
  limits: string;
}

interface ThreatHistory {
  date: string;
  status: ThreatStatus;
}

interface CompetitorIntel {
  name: string;
  moat: string;
  weakness: string;
  status: ThreatStatus;
  intelSummary: string;
  strategicImplication?: string;
  pricingTiers?: PricingTier[];
  fundingOrMNA: string;
  lastChecked: string;
  history: ThreatHistory[];
}

export default function CompetitorWatch({ idea, rawData }: CompetitorWatchProps) {
  const [competitors, setCompetitors] = useState<CompetitorIntel[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [scanningAll, setScanningAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-competitor-intel');
    if (saved) {
      try {
        setCompetitors(JSON.parse(saved));
        return;
      } catch (e) {}
    }

    const p2Result = rawData?.p2?.result;
    if (p2Result?.directCompetitors && Array.isArray(p2Result.directCompetitors)) {
      const initial = p2Result.directCompetitors.map((c: any) => ({
        name: c.name || 'Unknown',
        moat: c.moat || 'Unknown',
        weakness: c.weakness || 'Unknown',
        status: 'Unknown',
        intelSummary: 'Click "Refresh Intel" to run a live web search for recent changes.',
        strategicImplication: '',
        pricingTiers: [],
        fundingOrMNA: 'Unknown',
        lastChecked: 'Never',
        history: [{ date: new Date().toISOString(), status: 'Unknown' as ThreatStatus }]
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
      const desc = `Competitor in the ${idea.industry || 'same'} space. Their known moat is: ${comp.moat}.`;
      
      const res = await actions.refreshCompetitorIntel(comp.name, desc, token);
      
      if (res.result) {
        setCompetitors(prev => {
          const next = [...prev];
          const old = next[index];

          // Store history (max 5 items)
          const newHistory = [...(old.history || [])];
          // Don't add if it's identical status on the same day to avoid spamming dots
          const todayStr = new Date().toDateString();
          const lastHistory = newHistory[newHistory.length - 1];
          if (!(lastHistory && new Date(lastHistory.date).toDateString() === todayStr && lastHistory.status === res.result.status)) {
             newHistory.push({ date: new Date().toISOString(), status: res.result.status || 'Unknown' });
             if (newHistory.length > 5) newHistory.shift();
          }

          next[index] = {
            ...old,
            status: res.result.status || 'Unknown',
            intelSummary: res.result.intelSummary || old.intelSummary,
            strategicImplication: res.result.strategicImplication || '',
            pricingTiers: Array.isArray(res.result.pricingTiers) ? res.result.pricingTiers : [],
            fundingOrMNA: res.result.fundingOrMNA || old.fundingOrMNA,
            lastChecked: new Date().toISOString(),
            history: newHistory
          };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to refresh intel for ${competitors[index].name}`);
    } finally {
      setLoadingIndex(null);
    }
  };

  const scanAll = async () => {
    setScanningAll(true);
    // Parallel updates
    await Promise.allSettled(
      competitors.map((_, i) => refreshIntel(i))
    );
    setScanningAll(false);
  };

  const clearIntel = () => {
    if(confirm("Clear all scanned intelligence?")) {
       localStorage.removeItem('co-validator-competitor-intel');
       window.location.reload();
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'Threat Level Increased') return 'bg-red-500 text-white';
    if (status === 'Threat Level Decreased') return 'bg-green-500 text-white';
    if (status === 'No Meaningful Change') return 'bg-gray-500 text-white';
    return 'bg-white/10 text-gray-400';
  };

  const getStatusDotColor = (status: string) => {
    if (status === 'Threat Level Increased') return 'bg-red-500';
    if (status === 'Threat Level Decreased') return 'bg-green-500';
    if (status === 'No Meaningful Change') return 'bg-gray-500';
    return 'bg-gray-700';
  }

  if (competitors.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-black/40 border border-white/10 rounded-2xl text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Direct Competitors Found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Live Competitor Comms</h2>
          <p className="text-gray-400 text-sm">
            Static analysis is for losers. This runs deep web searches on your competitors to catch any recent feature launches, pricing changes, or M&A activity that could threaten your launch.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={scanAll}
            disabled={scanningAll || loadingIndex !== null}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center gap-2"
          >
            {scanningAll ? <span className="animate-spin text-sm">🕵️</span> : '🛰️'}
            {scanningAll ? 'Scanning All Frequencies...' : 'Scan All Radars'}
          </button>
          <button onClick={clearIntel} className="text-gray-500 hover:text-white px-4 text-xs font-bold uppercase tracking-wider transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {competitors.map((comp, idx) => (
          <div key={idx} className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:border-white/20 transition-all relative">
            {/* Header */}
            <div className="p-6 md:p-8 bg-white/5 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-2xl font-black text-white">{comp.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded inline-block ${getStatusColor(comp.status)}`}>
                    {comp.status}
                  </span>
                  {comp.lastChecked !== 'Never' && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-1">
                      Last scan: {new Date(comp.lastChecked).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => refreshIntel(idx)}
                disabled={loadingIndex !== null || scanningAll}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all shrink-0"
              >
                {loadingIndex === idx ? 'Searching...' : 'Refresh Intel'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
              
              {/* Column 1: Core Static Data & Trend */}
              <div className="p-6 md:p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3">Their Moat</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-bold">{comp.moat}</p>
                </div>
                <div>
                  <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3">Their Weakness</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-bold">{comp.weakness}</p>
                </div>

                {/* Threat Trend Timeline */}
                {comp.history && comp.history.length > 1 && (
                  <div>
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-3">Threat Trend</h4>
                    <div className="flex items-center gap-2">
                      {comp.history.map((h, i) => (
                         <div key={i} className="flex items-center group relative">
                           {i > 0 && <div className="w-4 h-px bg-white/10" />}
                           <div className={`w-3 h-3 rounded-full ${getStatusDotColor(h.status)} border border-white/10 group-hover:scale-150 transition-transform`} />
                           {/* Tooltip */}
                           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                             {new Date(h.date).toLocaleDateString()}
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Live Intel & Strategic Implication */}
              <div className="p-6 md:p-8 lg:col-span-2 space-y-8 bg-[#111]">
                <div className="space-y-4">
                  <h4 className="text-[10px] text-blue-500 uppercase tracking-widest font-black">Latest Field Report</h4>
                  <p className="text-base text-gray-200 leading-relaxed max-w-2xl font-serif">
                    {comp.intelSummary}
                  </p>
                </div>

                {comp.strategicImplication && (
                  <div className="bg-red-500/10 border-l-4 border-red-500 p-4 max-w-2xl rounded-r-lg">
                    <h4 className="text-[10px] text-red-500 uppercase tracking-widest font-black mb-1">Strategic Implication</h4>
                    <p className="text-sm text-red-200/80 font-bold">{comp.strategicImplication}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-4">
                  
                  {/* Pricing Tiers Array */}
                  <div className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-4">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Pricing Recon</h4>
                    {comp.pricingTiers && comp.pricingTiers.length > 0 ? (
                      <div className="space-y-3">
                        {comp.pricingTiers.map((tier, tIdx) => (
                          <div key={tIdx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                            <div>
                               <span className="text-xs font-bold text-white block">{tier.tier}</span>
                               <span className="text-[10px] text-gray-500 max-w-[150px] truncate block">{tier.limits}</span>
                            </div>
                            <span className="text-sm font-black text-green-400">{tier.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 font-bold">No tiers detected.</p>
                    )}
                  </div>

                  {/* Funding */}
                  <div className="bg-white/5 rounded-xl border border-white/5 p-4 space-y-4">
                    <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Funding / M&A Radar</h4>
                    <p className="text-sm text-gray-300 font-bold">{comp.fundingOrMNA}</p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
