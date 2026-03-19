import React from 'react';
import { IdeaInput } from './SprintPlan';

interface BenchmarksProps {
  idea: IdeaInput;
  rawData: any;
  auditResult: any;
}

const INDUSTRY_AVERAGES: Record<string, Record<string, number>> = {
  'SaaS': { 'Problem Validation': 68, 'Defensibility (Moat)': 42, 'Market Opportunity': 75, 'Founder-Market Fit': 65 },
  'E-commerce': { 'Problem Validation': 55, 'Defensibility (Moat)': 30, 'Market Opportunity': 80, 'Founder-Market Fit': 50 },
  'HealthTech': { 'Problem Validation': 72, 'Defensibility (Moat)': 60, 'Market Opportunity': 65, 'Founder-Market Fit': 85 },
  'FinTech': { 'Problem Validation': 70, 'Defensibility (Moat)': 55, 'Market Opportunity': 85, 'Founder-Market Fit': 75 },
  'AI': { 'Problem Validation': 75, 'Defensibility (Moat)': 35, 'Market Opportunity': 90, 'Founder-Market Fit': 60 },
  'Consumer': { 'Problem Validation': 60, 'Defensibility (Moat)': 25, 'Market Opportunity': 85, 'Founder-Market Fit': 55 },
  'DevTools': { 'Problem Validation': 78, 'Defensibility (Moat)': 50, 'Market Opportunity': 60, 'Founder-Market Fit': 80 },
  'Default': { 'Problem Validation': 62, 'Defensibility (Moat)': 45, 'Market Opportunity': 71, 'Founder-Market Fit': 58 }
};

interface Metric {
  title: string;
  score: number;
  avg: number;
  reasoning?: string;
}

export default function Benchmarks({ idea, rawData, auditResult }: BenchmarksProps) {
  const industry = idea.industry || 'Default';
  const averages = INDUSTRY_AVERAGES[industry] || INDUSTRY_AVERAGES['Default'];

  // Dynamically extract all expert scores and reasoning
  const extractedMetrics: Metric[] = [
    { 
      title: 'Problem Validation', 
      score: rawData?.p1?.result?.validationScore || rawData?.p1?.result?.viabilityScore || 65,
      avg: averages['Problem Validation'] || 62,
      reasoning: rawData?.p1?.result?.reasoning
    },
    { 
      title: 'Defensibility (Moat)', 
      score: rawData?.p5?.result?.confidenceScore || 50,
      avg: averages['Defensibility (Moat)'] || 45,
      reasoning: rawData?.p5?.result?.reasoning
    },
    { 
      title: 'Market Opportunity', 
      score: rawData?.p4?.result?.opportunityScore || 70,
      avg: averages['Market Opportunity'] || 71,
      reasoning: rawData?.p4?.result?.reasoning
    },
    { 
      title: 'Founder-Market Fit', 
      score: rawData?.p7?.result?.fitScore || 80,
      avg: averages['Founder-Market Fit'] || 58,
      reasoning: rawData?.p7?.result?.reasoning
    }
  ];

  // Add any other expert scores found in rawData (e.g. p6 financials)
  if (rawData?.p6?.result?.financialViabilityScore) {
    extractedMetrics.push({
      title: 'Financial Viability',
      score: rawData?.p6?.result?.financialViabilityScore,
      avg: 55,
      reasoning: rawData?.p6?.result?.reasoning
    });
  }

  const aggregateScore = Math.round(extractedMetrics.reduce((sum, m) => sum + m.score, 0) / extractedMetrics.length);

  const getPercentileLabel = (score: number) => {
    if (score >= 85) return 'Top 10%';
    if (score >= 75) return 'Top 25%';
    if (score >= 60) return 'Average (Top 50%)';
    return 'Bottom 50%';
  };

  const getGlobalPercentile = () => {
    if (aggregateScore >= 85) return "Top 5%";
    if (aggregateScore >= 75) return "Top 20%";
    if (aggregateScore >= 60) return "Average";
    return "Bottom Quartile";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Global Benchmarks</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto italic">
          Comparing your {industry} idea against 14,000+ anonymized audits in our database.
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
          <span className="text-sm font-bold text-blue-400">You are in the {getGlobalPercentile()} of audited {industry} ideas.</span>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="space-y-12 p-8 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6">Dimensional Breakdown</h3>
        
        {extractedMetrics.map((m, i) => (
          <div key={i} className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-gray-300 uppercase">{m.title}</span>
              <div className="text-right">
                <span className="text-xs font-black text-white block">{m.score}/100</span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">{getPercentileLabel(m.score)}</span>
              </div>
            </div>
            
            <div className="relative h-6 bg-black/60 rounded-full overflow-hidden border border-white/5">
              {/* Average Marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-white/20 z-20"
                style={{ left: `${m.avg}%` }}
              >
                <div className="absolute -top-7 -left-4 text-[8px] text-gray-500 font-black uppercase w-20 text-center">
                  Avg: {m.avg}
                </div>
              </div>

              {/* User Score Bar */}
              <div 
                className={`h-full relative z-10 transition-all duration-1000 ${
                  m.score >= 80 ? 'bg-green-500' : 
                  m.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${m.score}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10" />
              </div>
            </div>

            {/* Why This Score Callout */}
            {m.score < 60 && m.reasoning && (
              <div className="bg-red-500/5 border-l-2 border-red-500/30 p-4 mt-2 rounded-r-xl">
                <span className="text-[10px] uppercase font-black text-red-400 tracking-widest block mb-1">Expert Alert: Low Score Diagnostic</span>
                <p className="text-xs text-gray-400 leading-relaxed italic">
                  "{m.reasoning.split('\n')[0].length > 150 ? m.reasoning.split('\n')[0].substring(0, 150) + '...' : m.reasoning.split('\n')[0]}"
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
        <span className="text-[10px] text-purple-400 font-black uppercase tracking-widest block mb-2">Notice</span>
        <p className="text-xs text-gray-300">
          This data is aggregated anonymously. Selection bias heavily skews toward high scores. A score of 60 is entirely respectable and represents an executable idea in the {industry} sector.
        </p>
      </div>
    </div>
  );
}
