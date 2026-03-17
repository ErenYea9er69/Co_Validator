'use client';

import { useState } from 'react';
import * as actions from './actions';

export default function Home() {
  const [idea, setIdea] = useState({
    name: '',
    problem: '',
    solution: '',
    industry: '',
    monetization: '',
    competitorsInfo: ''
  });
  const [founderDNA] = useState({
    skills: ['Technical Generalist'],
    budget: 'Bootstrap',
    timeCommitment: 'Full-time'
  });
  
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<number>(-1); // -1 = idle
  const [phaseName, setPhaseName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [challenges, setChallenges] = useState<any>(null);

  // Store intermediate results to populate the full report
  const [rawData, setRawData] = useState<any>({});

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-10), msg]);

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setChallenges(null);
    setRawData({});
    setShowFullReport(false);
    setLogs(['Initiating engines...']);
    
    try {
      // 1. Problem Reality
      setPhase(1);
      setPhaseName('Problem Reality');
      addLog('Searching for real-world pain markers...');
      const p1 = await actions.runPhase1Problem(idea, "Initial Scan");
      setRawData((prev: any) => ({ ...prev, p1 }));
      addLog('Problem reality check complete.');

      // 2. Competitors
      setPhase(2);
      setPhaseName('Competitor Investigation');
      addLog('Scanning the direct and hidden landscape...');
      const p2 = await actions.runPhase2Competitors(idea, idea.competitorsInfo);
      setRawData((prev: any) => ({ ...prev, p2 }));
      addLog('Competitor scan complete.');

      // 3. Competition Saturation
      setPhase(3);
      setPhaseName('Competition Saturation');
      addLog('Analyzing market density...');
      const p3 = await actions.runPhase3Competition(idea, p2.raw);
      setRawData((prev: any) => ({ ...prev, p3 }));
      addLog('Saturation analysis complete.');

      // 4. Build Feasibility
      setPhase(4);
      setPhaseName('Build Feasibility');
      addLog('Evaluating complexity vs founder profile...');
      const p4 = await actions.runPhase4Feasibility(idea, founderDNA);
      setRawData((prev: any) => ({ ...prev, p4 }));
      addLog('Feasibility study complete.');

      // 5. Market & Monetization
      setPhase(5);
      setPhaseName('Market & Monetization');
      addLog('Simulating pricing and unit economics...');
      const p5 = await actions.runPhase5Market(idea);
      setRawData((prev: any) => ({ ...prev, p5 }));
      addLog('Market simulation complete.');

      // 6. Differentiation
      setPhase(6);
      setPhaseName('Differentiation');
      addLog('Hunting for asymmetric advantages...');
      const p6 = await actions.runPhase6Differentiation(idea, p2.raw);
      setRawData((prev: any) => ({ ...prev, p6 }));
      addLog('Differentiation report generated.');

      // ═══ AUTONOMOUS INTERROGATION (BACKGROUND) ═══
      setPhase(6.5);
      setPhaseName('Deep Interrogation');
      addLog('Consulting pattern matching algorithms for hidden risks...');
      const interrogationData = await actions.runInterrogation(idea, founderDNA);
      addLog('Deep risks identified.');

      // ═══ AUTONOMOUS PRE-MORTEM (BACKGROUND) ═══
      setPhase(6.8);
      setPhaseName('Survival Simulation');
      addLog('Simulating critical failure vectors...');
      const preMortemData = await actions.runPreMortem(idea, founderDNA);
      setChallenges({ interrogation: interrogationData, preMortem: preMortemData });
      addLog('Failure vectors mapped.');

      // 7. Failure Scenarios
      setPhase(7);
      setPhaseName('Expert Stress Test');
      const p7 = await actions.runPhase7Failures(idea, preMortemData, { p1, p2, p3, p4, p5, p6 });
      setRawData((prev: any) => ({ ...prev, p7 }));
      addLog('Stress test complete.');

      // 8. Final Scoring
      setPhase(8);
      setPhaseName('Final Scoring');
      addLog('Synthesizing Master Verdict...');
      const finalResult = await actions.finalizeAudit(idea, interrogationData, preMortemData, { p1, p2, p3, p4, p5, p6, p7 }, founderDNA);
      
      setResult(finalResult);
      setPhase(10);
    } catch (err) {
      console.error(err);
      addLog('Error: Audit terminated prematurely.');
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `audit_${idea.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)] text-white font-sans scroll-smooth">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!showFullReport && (
          <header className="mb-16 text-center animate-fade-in">
            <h1 className="text-6xl font-black mb-4 tracking-tighter">
              CO<span className="text-purple-500">VALIDATOR</span>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded ml-2 uppercase tracking-widest align-middle">Deep Audit</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
              "The Silicon Valley Blitz-Auditor" — Full 8-phase autonomous simulation.
            </p>
          </header>
        )}

        {/* Surface Level Warning */}
        {result?.dataQuality?.isSurfaceLevel && (
          <div className="max-w-4xl mx-auto mb-12 glass-card border-red-500 animate-bounce-subtle">
             <div className="flex gap-4 items-center mb-4">
                <span className="text-4xl">⚠️</span>
                <div>
                   <h3 className="text-2xl font-black text-red-500 uppercase">REALITY CHECK: SURFACE-LEVEL DATA</h3>
                   <p className="text-gray-400 font-mono text-sm">{result.dataQuality.realityCheck}</p>
                </div>
             </div>
             <p className="text-gray-300 p-4 bg-red-500/10 rounded-lg">{result.dataQuality.missingCriticalInfo}</p>
          </div>
        )}

        {/* Input Form */}
        {!result && phase === -1 && !showFullReport && (
          <div className="max-w-2xl mx-auto glass-card animate-fade-in shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Initialize Idea</h2>
            <form onSubmit={startAudit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Startup Name</label>
                  <input 
                    type="text" 
                    value={idea.name}
                    onChange={(e) => setIdea({...idea, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. Acme AI"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
                  <input 
                    type="text" 
                    value={idea.industry}
                    onChange={(e) => setIdea({...idea, industry: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. FoodTech"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Problem (Be Specific)</label>
                <textarea 
                  value={idea.problem}
                  onChange={(e) => setIdea({...idea, problem: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="What deep pain are you solving?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Solution & Key Features</label>
                <textarea 
                  value={idea.solution}
                  onChange={(e) => setIdea({...idea, solution: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="How does it work? What are the core features?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Strategy & Competitors (Crucial)</label>
                <textarea 
                  value={idea.competitorsInfo}
                  onChange={(e) => setIdea({...idea, competitorsInfo: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="Who are the incumbents? How will you beat them? What is your revenue model?"
                />
              </div>
              <button 
                type="submit" 
                className="w-full btn-premium py-4 font-black"
              >
                START DEEP AUDIT
              </button>
            </form>
          </div>
        )}

        {/* Loading / Progress State */}
        {loading && !showFullReport && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-20 animate-fade-in">
            <div className="relative inline-block">
              <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin shadow-lg shadow-purple-500/20" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-purple-400">
                {Math.round((phase / 8) * 100)}%
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">
                {phase >= 0 && phase < 10 ? `Phase ${Math.floor(phase)}: ${phaseName}` : 'Finalizing Master Dossier...'}
              </h3>
              <p className="text-gray-400 italic">Executing cross-dimension validation and survival simulations...</p>
            </div>
            <div className="glass-card text-left bg-black text-xs font-mono p-4 opacity-70 border-white/5 shadow-inner">
              {logs.map((log, i) => <div key={i} className="mb-1 text-purple-300">{`> ${log}`}</div>)}
            </div>
          </div>
        )}

        {/* Result Header Buttons */}
        {result && (
          <div className="flex justify-end gap-4 print:hidden mb-8 animate-fade-in">
             <button 
                onClick={() => setShowFullReport(!showFullReport)}
                className="px-6 py-2 border border-purple-500 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-500/10 transition-all text-purple-400"
              >
                {showFullReport ? 'View Scoreboard' : 'View Full Dossier'}
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 border border-white/20 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-400"
              >
                Print Report
              </button>
              <button 
                onClick={downloadJSON}
                className="px-6 py-2 bg-purple-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/40"
              >
                Export JSON
              </button>
          </div>
        )}

        {/* SCOREBOARD VIEW */}
        {result && !showFullReport && (
          <div className="animate-fade-in space-y-12">
            {/* Verdict Header */}
            <div className="glass-card !bg-purple-900/10 border-purple-500/50 p-10 text-center shadow-2xl">
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                  {Object.entries(result.compositeScores || {}).slice(0, 5).map(([key, value]) => (
                    <div key={key} className="px-6 py-3 glass rounded-xl border border-white/5 flex flex-col items-center min-w-[120px]">
                      <span className="text-[10px] uppercase text-gray-400 font-black mb-1 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-3xl font-black text-white">{String(value)}%</span>
                    </div>
                  ))}
              </div>
              <h3 className="text-5xl lg:text-6xl font-black mb-8 italic leading-tight max-w-5xl mx-auto drop-shadow-lg text-white">
                "{result.verdictLabel}"
              </h3>
              <div className="flex justify-center">
                  <span className={`px-10 py-3 rounded-full font-black tracking-widest uppercase text-xl border-2 ${
                    result.verdict === '🚀' || result.verdict === '✅' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                    result.verdict === '❌' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                  }`}>
                    VERDICT: {result.verdict}
                  </span>
              </div>
            </div>

            {/* Main Score & Signals Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Dimension Heatmap */}
              <section className="glass-card">
                <h4 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 text-purple-400 uppercase tracking-tighter">Dimension Heatmap</h4>
                <div className="space-y-6">
                    {result.scores && Object.entries(result.scores).map(([name, data]: [string, any]) => (
                      <div key={name} className="group relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-bold text-gray-300 tracking-wide uppercase">{name.replace(/_/g, ' ')}</span>
                          <span className="font-black text-purple-400 text-lg">{data.score || data}/10</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-gradient-to-r from-purple-800 to-purple-500 transition-all duration-1000 shadow-[0_0_10px_purple]" style={{ width: `${Number(data.score || data) * 10}%` }} />
                        </div>
                        {data.reason && (
                          <p className="text-xs text-gray-500 italic leading-snug group-hover:text-gray-300 transition-colors">{data.reason}</p>
                        )}
                      </div>
                    ))}
                </div>
              </section>

              {/* Expert Signals */}
              <div className="space-y-8">
                <div className="glass-card bg-purple-500/5">
                  <h4 className="text-xs font-black text-purple-400 uppercase mb-4 tracking-widest">Master Reasoning</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{result.reasoning}</p>
                </div>
                
                {challenges && (
                  <div className="glass-card border-l-4 border-orange-500 bg-orange-500/5">
                    <h4 className="text-xs font-black text-orange-500 uppercase mb-4 tracking-widest">Critical Challenges Identified</h4>
                    <div className="space-y-4">
                      {challenges.interrogation?.questions?.slice(0, 3).map((q: any, i: number) => (
                        <div key={i} className="text-sm p-3 bg-white/5 rounded-lg border border-white/5">
                          <p className="font-black text-white mb-1">Q: {q.question}</p>
                          <p className="text-xs text-red-400 italic">Impact: {q.conflictNugget}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="glass-card border-l-4 border-green-500 bg-green-500/5">
                      <h4 className="text-xs font-black text-green-500 uppercase mb-4 tracking-widest">Winnability Factors</h4>
                      <ul className="space-y-3">
                          {result.expertSignals?.green?.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                               <span className="text-green-500 font-bold">✓</span> {r}
                            </li>
                          ))}
                      </ul>
                  </div>

                  <div className="glass-card border-l-4 border-red-500 bg-red-500/5">
                      <h4 className="text-xs font-black text-red-500 uppercase mb-4 tracking-widest">Critical Vulnerabilities</h4>
                      <ul className="space-y-3">
                          {result.expertSignals?.red?.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                               <span className="text-red-500 font-bold">⚠️</span> {r}
                            </li>
                          ))}
                      </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL DOSSIER VIEW */}
        {result && showFullReport && (
          <div className="animate-fade-in space-y-20 pb-24 dossier-view">
             <div className="text-center mb-24 animate-pulse-slow">
                <h2 className="text-7xl font-black mb-4 uppercase tracking-tighter text-white">DOSSIER: {idea.name}</h2>
                <div className="h-1 w-32 bg-purple-500 mx-auto mb-6" />
                <p className="text-gray-500 uppercase tracking-[1em] text-sm font-black">Confidential Level 4 Audit</p>
             </div>

             {/* I. Problem & Evidence Analysis */}
             <section className="space-y-8 animate-slide-up">
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">I</span>
                   PROBLEM & MARKET EVIDENCE
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card border border-white/5 space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Anthropological Evidence</h4>
                      <p className="text-lg text-gray-300 leading-relaxed font-medium italic">"{rawData.p1?.parsed?.reasoning || "Analyzing problem gravity and market pain markers..."}"</p>
                   </div>
                   <div className="glass-card border border-white/5">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Market Findings</h4>
                      <ul className="space-y-4">
                         {rawData.p1?.parsed?.verifyingEvidence?.map((e: any, i: number) => (
                           <li key={i} className="text-sm text-gray-400 p-3 bg-white/5 rounded-lg border-l-2 border-purple-500">
                             {e.fact || e}
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>
             </section>

             {/* II. Competitive Landscape */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">II</span>
                   COMPETITIVE LANDSCAPE
                </h3>
                <div className="grid lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-6 tracking-widest">Incumbent Radar</h4>
                      <div className="grid gap-4">
                         {rawData.p2?.parsed?.directCompetitors?.map((c: any, i: number) => (
                           <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center group hover:bg-white/10 transition-all">
                              <div>
                                 <p className="font-black text-white text-lg">{c.name}</p>
                                 <p className="text-xs text-purple-400">{c.marketShare || "Core Competitor"}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-xs text-red-500 font-bold mb-1">STRENGTH: {c.moat || "Incumbency"}</p>
                                 <p className="text-xs text-green-500 font-bold">WEAKNESS: {c.weakness || "Pricing/Agility"}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="glass-card bg-red-500/5 border-red-500/20">
                      <h4 className="text-xs font-black text-red-500 uppercase mb-6 tracking-widest">The Death Vector</h4>
                      <p className="text-lg font-black mb-4">"{rawData.p3?.parsed?.saturationRisk || "Deep Sea Red Ocean Risk"}"</p>
                      <p className="text-sm text-gray-400 leading-relaxed italic">{rawData.p3?.parsed?.brutalTruth}</p>
                   </div>
                </div>
             </section>

             {/* III. Feasibility dossier */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">III</span>
                   EXECUTION DOSSIER
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Feasibility Analysis</h4>
                      <p className="text-gray-300 leading-relaxed font-bold italic">"{rawData.p4?.parsed?.complexityAssessment || "Calculating implementation debt..."}"</p>
                      <div className="mt-6 flex gap-4">
                         <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Budget Path</span>
                            <span className="font-black text-orange-400">{rawData.p4?.parsed?.bestBudgetPath || "N/A"}</span>
                         </div>
                         <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Time to MVP</span>
                            <span className="font-black text-orange-400">{rawData.p4?.parsed?.timeToMVP || "N/A"}</span>
                         </div>
                      </div>
                   </div>
                   <div className="glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Asymmetric Advantage</h4>
                      <p className="text-lg text-green-400 font-black mb-4 underline decoration-green-500/30 font-mono tracking-tighter uppercase">{rawData.p6?.parsed?.primaryAdvantage || "Scanning for Moats..."}</p>
                      <p className="text-sm text-gray-400 italic">Strategy: {rawData.p6?.parsed?.differentiationStrategy}</p>
                   </div>
                </div>
             </section>

             {/* IV. Economics sandbox */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">IV</span>
                   UNIT ECONOMICS & SCALE
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(result.unitEconomicsReality || {}).map(([key, val]) => (
                      <div key={key} className="glass-card text-center !bg-white/5 border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="text-[10px] text-gray-500 uppercase mb-2 font-black tracking-widest">{key}</div>
                        <div className="text-3xl font-black text-purple-400">{String(val)}</div>
                      </div>
                    ))}
                </div>
             </section>

             {/* V. Angel of Death Scenarios */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.8s' }}>
                <h3 className="text-3xl font-black text-orange-500 flex items-center gap-4">
                   <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30 underline decoration-orange-500/50">V</span>
                   ANGEL OF DEATH: SURVIVAL SIMULATION
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   {challenges?.preMortem?.scenarios?.map((s: any, i: number) => (
                      <div key={i} className="glass-card !bg-orange-500/5 border-orange-500/30 group hover:border-orange-500 transition-all">
                        <div className="flex justify-between items-start mb-6">
                           <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest">Simulated Failure Vector {i+1}</h4>
                           <span className="text-xs px-3 py-1 bg-red-500/20 text-red-500 rounded-full font-black uppercase">CRITICAL</span>
                        </div>
                        <p className="text-xl font-black text-white leading-tight mb-4 italic">"{s.scenario}"</p>
                        <div className="pt-4 border-t border-orange-500/20">
                           <p className="text-sm text-red-400 font-bold uppercase mb-1 flex items-center gap-2">
                             <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Fatal Flaw
                           </p>
                           <p className="text-gray-300 font-medium">{s.fatalFlaw}</p>
                        </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* VI. Final Committee Resolution */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">VI</span>
                   FINAL COMMITTEE RESOLUTION
                </h3>
                <div className="glass-card !bg-purple-500/5 border-purple-500/30">
                   <div className="grid lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest">Internal Conflict Resolution</h4>
                         <p className="text-lg leading-relaxed text-gray-300 font-bold italic">"{result.conflictResolution || "Simulation reached unanimous consensus without inter-council discord."}"</p>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-xs font-black text-green-400 uppercase tracking-widest">Master Trajectory</h4>
                         <p className="text-2xl font-black text-white leading-tight mb-2 tracking-tighter uppercase">{result.category || "General Admission"}</p>
                         <p className="text-sm text-gray-400 leading-relaxed italic">{result.reasoning}</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* Footer Button */}
             <div className="pt-12 text-center print:hidden pb-20">
                <button 
                  onClick={() => {setResult(null); setPhase(-1); setShowFullReport(false); setChallenges(null); setRawData({});}}
                  className="px-16 py-5 border border-white/10 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase text-xs font-black tracking-[0.5em] hover:border-purple-500/40"
                >
                  Terminate Audit Instance
                </button>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
