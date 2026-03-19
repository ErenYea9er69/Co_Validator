import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface BenchmarksProps {
  idea: IdeaInput;
  rawData: any;
  auditResult: any;
}

const FALLBACK_INDUSTRY_AVERAGES: Record<string, Record<string, number>> = {
  'SaaS': { 'Problem Validation': 68, 'Defensibility': 42, 'Market Opportunity': 75, 'Financial Viability': 60, 'Founder Fit': 65 },
  'E-commerce': { 'Problem Validation': 55, 'Defensibility': 30, 'Market Opportunity': 80, 'Financial Viability': 70, 'Founder Fit': 50 },
  'Hardware': { 'Problem Validation': 70, 'Defensibility': 85, 'Market Opportunity': 65, 'Financial Viability': 40, 'Founder Fit': 80 },
  'Consumer': { 'Problem Validation': 60, 'Defensibility': 25, 'Market Opportunity': 85, 'Financial Viability': 55, 'Founder Fit': 55 },
  'Default': { 'Problem Validation': 62, 'Defensibility': 45, 'Market Opportunity': 71, 'Financial Viability': 58, 'Founder Fit': 58 }
};

const METRIC_LABELS = ['Problem Validation', 'Defensibility', 'Market Opportunity', 'Financial Viability', 'Founder Fit'];

interface Metric {
  title: string;
  score: number;
  avg: number;
  reasoning?: string;
  actionPlan?: string;
  loadingAction?: boolean;
}

export default function Benchmarks({ idea, rawData, auditResult }: BenchmarksProps) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [auditSampleCount, setAuditSampleCount] = useState<number>(0);

  useEffect(() => {
    // 1. Manage Audit History for Dynamic Averages
    const industry = idea.industry || 'Default';
    let history: any[] = [];
    try {
      history = JSON.parse(localStorage.getItem('co-validator-audit-history') || '[]');
    } catch (e) {}

    // Check if THIS audit is already in history (by name/time roughly)
    const isNew = !history.find(h => h.name === idea.name && h.industry === industry);
    if (isNew) {
      history.push({
        name: idea.name,
        industry: industry,
        date: new Date().toISOString(),
        scores: {
          'Problem Validation': rawData?.p1?.result?.validationScore || rawData?.p1?.result?.viabilityScore || 65,
          'Defensibility': rawData?.p5?.result?.confidenceScore || 50,
          'Market Opportunity': rawData?.p4?.result?.opportunityScore || 70,
          'Financial Viability': rawData?.p6?.result?.marginViabilityScore || 60,
          'Founder Fit': rawData?.p7?.result?.founderMarketFitScore || 65
        }
      });
      localStorage.setItem('co-validator-audit-history', JSON.stringify(history));
    }

    const industryAudits = history.filter(h => h.industry === industry);
    setAuditSampleCount(industryAudits.length);

    const fallbacks = FALLBACK_INDUSTRY_AVERAGES[industry] || FALLBACK_INDUSTRY_AVERAGES['Default'];
    
    // Compute Averages
    const computedAverages: Record<string, number> = {};
    for (const label of METRIC_LABELS) {
      if (industryAudits.length > 2) {
        // Use real dynamic average if we have enough samples
        const sum = industryAudits.reduce((acc, curr) => acc + (curr.scores[label] || 50), 0);
        computedAverages[label] = Math.round(sum / industryAudits.length);
      } else {
        computedAverages[label] = fallbacks[label] || 50;
      }
    }

    const initialMetrics: Metric[] = [
      { 
        title: 'Problem Validation', 
        score: rawData?.p1?.result?.validationScore || rawData?.p1?.result?.viabilityScore || 65,
        avg: computedAverages['Problem Validation'],
        reasoning: rawData?.p1?.result?.reasoning
      },
      { 
        title: 'Defensibility', 
        score: rawData?.p5?.result?.confidenceScore || 50,
        avg: computedAverages['Defensibility'],
        reasoning: rawData?.p5?.result?.reasoning
      },
      { 
        title: 'Market Opportunity', 
        score: rawData?.p4?.result?.opportunityScore || 70,
        avg: computedAverages['Market Opportunity'],
        reasoning: rawData?.p4?.result?.reasoning
      },
      { 
        title: 'Financial Viability', 
        score: rawData?.p6?.result?.marginViabilityScore || 60,
        avg: computedAverages['Financial Viability'],
        reasoning: rawData?.p6?.result?.marginReasoning || rawData?.p6?.result?.reasoning
      },
      { 
        title: 'Founder Fit', 
        score: rawData?.p7?.result?.founderMarketFitScore || 65,
        avg: computedAverages['Founder Fit'],
        reasoning: rawData?.p7?.result?.reasoning
      }
    ];

    setMetrics(initialMetrics);
  }, [idea, rawData]);

  const getActionPlan = async (index: number) => {
    setMetrics(prev => prev.map((m, i) => i === index ? { ...m, loadingAction: true } : m));
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const m = metrics[index];
      const res = await actions.getMetricActionAdvice(m.title, m.score, m.reasoning || '', idea.industry || 'Tech', token);
      
      if (res.result) {
        setMetrics(prev => prev.map((m, i) => i === index ? { ...m, actionPlan: res.result.actionableAdvice, loadingAction: false } : m));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to get action plan.");
      setMetrics(prev => prev.map((m, i) => i === index ? { ...m, loadingAction: false } : m));
    }
  };

  // SV Radar Chart Helper functions
  const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const getPoint = (score: number, angleDeg: number, center: number, radius: number) => {
    const rad = degreesToRadians(angleDeg - 90); // -90 so top is 0
    const distance = radius * (Math.max(0, Math.min(100, score)) / 100);
    return {
      x: center + distance * Math.cos(rad),
      y: center + distance * Math.sin(rad)
    };
  };

  const center = 150;
  const radius = 100;
  const numAxes = METRIC_LABELS.length;
  const angleStep = 360 / numAxes;

  const userPolygonPoints = metrics.map((m, i) => {
    const pt = getPoint(m.score, i * angleStep, center, radius);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const avgPolygonPoints = metrics.map((m, i) => {
    const pt = getPoint(m.avg, i * angleStep, center, radius);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Competitive Benchmarks</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          How your idea stacks up against industry averages based on past audits.
        </p>
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
            {idea.industry || 'Default'} Layer Active (n={auditSampleCount > 2 ? auditSampleCount : 'Baseline'})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-black/40 border border-white/10 rounded-3xl p-8 shadow-xl">
        
        {/* SVG Radar Chart */}
        <div className="relative flex justify-center items-center w-full aspect-square max-w-[400px] mx-auto">
          <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
            {/* Background Webs */}
            {[20, 40, 60, 80, 100].map(level => {
              const points = METRIC_LABELS.map((_, i) => {
                const pt = getPoint(level, i * angleStep, center, radius);
                return `${pt.x},${pt.y}`;
              }).join(' ');
              return <polygon key={level} points={points} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            })}

            {/* Axes and Labels */}
            {METRIC_LABELS.map((label, i) => {
              const outerPt = getPoint(100, i * angleStep, center, radius);
              // Slightly further out for text label
              const textPt = getPoint(120, i * angleStep, center, radius);
              return (
                <g key={label}>
                  <line x1={center} y1={center} x2={outerPt.x} y2={outerPt.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text 
                    x={textPt.x} y={textPt.y} 
                    fill="rgba(255,255,255,0.5)" 
                    fontSize="9" 
                    fontWeight="bold"
                    textAnchor="middle" 
                    dominantBaseline="middle"
                    className="uppercase tracking-widest"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Average Polygon */}
            <polygon points={avgPolygonPoints} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
            
            {/* User Polygon */}
            <polygon points={userPolygonPoints} fill="rgba(59, 130, 246, 0.2)" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="3" />
            
            {/* User Points */}
            {metrics.map((m, i) => {
              const pt = getPoint(m.score, i * angleStep, center, radius);
              return <circle key={i} cx={pt.x} cy={pt.y} r="4" fill="#3b82f6" />;
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 px-4 py-2 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500"></div>
              <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">Your Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border border-white/30 border-dashed"></div>
              <span className="text-[9px] uppercase font-black tracking-widest text-gray-400">Industry Avg</span>
            </div>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-6">
          {metrics.map((metric, i) => {
             const deficit = metric.avg - metric.score;
             const isWarning = deficit > 0;

             return (
              <div key={i} className={`p-5 rounded-2xl border transition-all ${isWarning ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-white text-sm uppercase tracking-wider">{metric.title}</h4>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white leading-none">{metric.score}</div>
                    <div className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isWarning ? 'text-red-400' : 'text-green-400'}`}>
                      {isWarning ? `-${deficit} vs Avg` : `+${Math.abs(deficit)} vs Avg`}
                    </div>
                  </div>
                </div>
                
                {metric.reasoning && (
                  <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2">"{metric.reasoning}"</p>
                )}

                {/* Action Plan Section */}
                {metric.score < 60 && (
                  <div className="pt-4 border-t border-white/10">
                    {metric.actionPlan ? (
                      <div className="bg-blue-500/10 border-l-2 border-blue-500 p-3">
                        <span className="text-[9px] uppercase font-black text-blue-400 tracking-widest block mb-1">Tactical Fix</span>
                        <p className="text-xs text-blue-200/90 font-bold leading-relaxed">{metric.actionPlan}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => getActionPlan(i)}
                        disabled={metric.loadingAction}
                        className="text-[10px] uppercase font-black tracking-widest text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {metric.loadingAction ? 'Analyzing...' : '⚡ Get Action Plan to Fix'}
                      </button>
                    )}
                  </div>
                )}
              </div>
             );
          })}
        </div>

      </div>
    </div>
  );
}
