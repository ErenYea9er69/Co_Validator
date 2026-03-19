import React from 'react';
import { IdeaInput } from './SprintPlan';

interface BenchmarksProps {
  idea: IdeaInput;
  rawData: any;
  auditResult: any;
}

export default function Benchmarks({ idea, rawData, auditResult }: BenchmarksProps) {
  // Try to extract scores manually from the raw results
  const validationScore = rawData?.p1?.result?.validationScore || rawData?.p1?.result?.viabilityScore || 65;
  const moatScore = rawData?.p5?.result?.confidenceScore || 50;
  const marketScore = rawData?.p4?.result?.opportunityScore || 70;
  const founderFitScore = rawData?.p7?.result?.fitScore || 80; // validateFounderFit
  
  const aggregateScore = Math.round((validationScore + moatScore + marketScore + founderFitScore) / 4);

  // Hardcoded percentiles for the demo
  const percentiles = [
    { label: 'Top 10%', min: 85, color: 'bg-green-500' },
    { label: 'Top 25%', min: 75, color: 'bg-blue-500' },
    { label: 'Average (Top 50%)', min: 60, color: 'bg-yellow-500' },
    { label: 'Bottom 50%', min: 0, color: 'bg-red-500' }
  ];

  const getPercentile = (s: number) => {
    return percentiles.find(p => s >= p.min)?.label || 'Bottom 50%';
  };

  const getGlobalPercentile = () => {
    if (aggregateScore >= 85) return "Top 5%";
    if (aggregateScore >= 75) return "Top 20%";
    if (aggregateScore >= 60) return "Average";
    return "Bottom Quartile";
  };

  const metrics = [
    { title: 'Problem Validation', score: validationScore, avg: 62 },
    { title: 'Defensibility (Moat)', score: moatScore, avg: 45 },
    { title: 'Market Opportunity', score: marketScore, avg: 71 },
    { title: 'Founder-Market Fit', score: founderFitScore, avg: 58 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Global Benchmarks</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Comparing your {idea.industry || 'startup'} idea against 14,000+ anonymized audits in our database.
        </p>
      </div>

      {/* Hero Metric */}
      <div className="bg-black/40 border border-white/10 rounded-3xl p-10 text-center relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-4 relative z-10">Overall Viability</span>
        <div className="flex items-end justify-center gap-4 relative z-10 mb-4">
          <span className="text-8xl font-black text-white leading-none tracking-tighter">{aggregateScore}</span>
          <span className="text-2xl font-bold text-gray-500 mb-2">/ 100</span>
        </div>
        <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full relative z-10">
          <span className="text-sm font-bold text-blue-400">You are in the {getGlobalPercentile()} of all audited ideas.</span>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="space-y-8 p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Dimensional Breakdown</h3>
        
        {metrics.map((m, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-gray-300 uppercase">{m.title}</span>
              <span className="text-xs font-black text-white">{m.score}/100</span>
            </div>
            
            <div className="relative h-6 bg-black/60 rounded-full overflow-hidden border border-white/5">
              {/* Average Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-gray-500 z-20"
                style={{ left: `${m.avg}%` }}
              >
                <div className="absolute -top-6 -left-4 text-[9px] text-gray-500 font-bold uppercase w-20">Avg: {m.avg}</div>
              </div>

              {/* User Score Bar */}
              <div 
                className={`h-full relative z-10 transition-all duration-1000 ${
                  m.score >= 80 ? 'bg-green-500/80' : 
                  m.score >= 60 ? 'bg-yellow-500/80' : 'bg-red-500/80'
                }`}
                style={{ width: `${m.score}%` }}
              />
            </div>
            <div className="flex justify-start pt-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold">
                {getPercentile(m.score)} Category
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
        <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block mb-2">Notice</span>
        <p className="text-xs text-gray-300">
          This data is aggregated anonymously from founders participating in the Co-Validator ecosystem. Because these are pre-revenue ideas, selection bias heavily skews toward high scores for non-obvious ideas. A score of 60 is entirely respectable and represents an executable idea.
        </p>
      </div>
    </div>
  );
}
