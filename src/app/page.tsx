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
  const [stressTestInput, setStressTestInput] = useState('');
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  const [showVault, setShowVault] = useState(false);

  // Store intermediate results to populate the full report
  const [rawData, setRawData] = useState<any>({});

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-10), msg]);

  const renderSafe = (val: any) => {
    if (!val) return "";
    if (typeof val === 'string' || typeof val === 'number') return val;
    if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(', ');
    if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
    return String(val);
  };

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setChallenges(null);
    setRawData({});
    setShowFullReport(false);
    setStressTestResult(null);
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
        {result?.dataQuality?.isSurfaceLevel && !showFullReport && (
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
                "{renderSafe(result.verdictLabel)}"
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
                          <p className="font-black text-white mb-1">Q: {renderSafe(q.question)}</p>
                          <p className="text-xs text-red-400 italic">Impact: {renderSafe(q.conflictNugget)}</p>
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
                               <span className="text-green-500 font-bold">✓</span> {renderSafe(r)}
                            </li>
                          ))}
                      </ul>
                  </div>

                  <div className="glass-card border-l-4 border-red-500 bg-red-500/5">
                      <h4 className="text-xs font-black text-red-500 uppercase mb-4 tracking-widest">Critical Vulnerabilities</h4>
                      <ul className="space-y-3">
                          {result.expertSignals?.red?.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-3">
                               <span className="text-red-500 font-bold">⚠️</span> {renderSafe(r)}
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
          <div className="animate-fade-in space-y-20 pb-24 dossier-view relative">
             {/* BENTO GRID HEADER */}
             <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[400px]">
                <div className="md:col-span-2 md:row-span-2 glass-card flex flex-col justify-center p-12 bg-purple-500/5 border-purple-500/30">
                   <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter text-white leading-none">DOSSIER: {idea.name}</h2>
                   <div className="h-1 w-20 bg-purple-500 mb-6" />
                   <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Confidential Level 4 Audit</p>
                </div>
                <div className="glass-card flex flex-col items-center justify-center !bg-white/5 border-white/10">
                   <span className="text-[10px] text-gray-500 uppercase font-black mb-1">Founder Fit</span>
                   <span className="text-4xl font-black text-white">{result.founderAlignment?.alignmentScore || "???"}%</span>
                </div>
                <div className="glass-card flex flex-col items-center justify-center !bg-white/5 border-white/10">
                   <span className="text-[10px] text-gray-500 uppercase font-black mb-1">Burn Risk</span>
                   <span className={`text-xl font-black uppercase ${result.founderAlignment?.burnRisk === 'High' ? 'text-red-500' : 'text-green-400'}`}>
                      {result.founderAlignment?.burnRisk || "Analyzing"}
                   </span>
                </div>
                <div className="md:col-span-2 glass-card flex items-center gap-6 !bg-white/5 border-white/10">
                   <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-2xl">🧬</div>
                   <p className="text-sm text-gray-400 leading-relaxed italic pr-4">"{result.founderAlignment?.brutalTruth || "Finalizing alignment map..."}"</p>
                </div>
             </div>

             {/* Evidence Vault Toggle */}
             <button 
                onClick={() => setShowVault(true)}
                className="fixed right-8 bottom-8 z-50 px-6 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-4 border-black group"
             >
                <span className="bg-black text-white w-5 h-5 flex items-center justify-center rounded-full group-hover:rotate-12 transition-transform">i</span>
                Evidence Vault
             </button>

             {/* Sliding Vault Panel */}
             {showVault && (
               <div className="fixed inset-0 z-[100] flex justify-end">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowVault(false)} />
                  <div className="w-full max-w-xl h-full bg-[#0a0a0a] border-l border-white/10 p-12 overflow-y-auto animate-slide-in-right relative">
                     <button onClick={() => setShowVault(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white font-black">CLOSE [X]</button>
                     <h3 className="text-3xl font-black text-white mb-8 underline decoration-purple-500">THE EVIDENCE VAULT</h3>
                     <div className="space-y-12">
                        {Object.entries(result.evidenceVault || {}).map(([phase, data]: any) => (
                           <div key={phase} className="space-y-4">
                              <h4 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{phase.replace(/_/g, ' ')}</h4>
                              <div className="grid gap-3">
                                 {data.map((res: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                       <p className="text-[10px] text-gray-500 mb-1 uppercase font-bold">{res.domain || "Source"}</p>
                                       <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-purple-400 leading-tight block mb-2">{res.title}</a>
                                       <p className="text-xs text-gray-400 line-clamp-2 italic">"{res.content || res.snippet}"</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}

             {/* I. Problem & Evidence Analysis */}
             <section className="space-y-8 animate-slide-up">
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">I</span>
                   PROBLEM & MARKET EVIDENCE
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card border border-white/5 space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Anthropological Evidence</h4>
                      <p className="text-lg text-gray-300 leading-relaxed font-medium italic">"{renderSafe(rawData.p1?.parsed?.reasoning) || "Analyzing problem gravity and market pain markers..."}"</p>
                   </div>
                   <div className="glass-card border border-white/5">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Market Findings</h4>
                      <ul className="space-y-4">
                         {rawData.p1?.parsed?.verifyingEvidence?.map((e: any, i: number) => (
                           <li key={i} className="text-sm text-gray-400 p-3 bg-white/5 rounded-lg border-l-2 border-purple-500">
                             {renderSafe(e.fact || e)}
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
                      <p className="text-lg font-black mb-4">"{renderSafe(rawData.p3?.parsed?.saturationRisk) || "Deep Sea Red Ocean Risk"}"</p>
                      <p className="text-sm text-gray-400 leading-relaxed italic">{renderSafe(rawData.p3?.parsed?.brutalTruth)}</p>
                   </div>
                </div>
             </section>

             {/* III. Execution Dossier */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">III</span>
                   EXECUTION DOSSIER
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Feasibility Analysis</h4>
                      <p className="text-gray-300 leading-relaxed font-bold italic">"{renderSafe(rawData.p4?.parsed?.complexityAssessment) || "Calculating implementation debt..."}"</p>
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
                      <p className="text-lg text-green-400 font-black mb-4 underline decoration-green-500/30 font-mono tracking-tighter uppercase">{renderSafe(rawData.p6?.parsed?.primaryAdvantage) || "Scanning for Moats..."}</p>
                      <p className="text-sm text-gray-400 italic">Strategy: {renderSafe(rawData.p6?.parsed?.differentiationStrategy)}</p>
                   </div>
                </div>
             </section>

             {/* IV. Economics Sandbox */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">IV</span>
                   UNIT ECONOMICS & SCALE
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(result.unitEconomicsReality || {}).map(([key, val]) => (
                      <div key={key} className="glass-card text-center !bg-white/5 border-purple-500/10 hover:border-purple-500/30 transition-all">
                        <div className="text-[10px] text-gray-500 uppercase mb-2 font-black tracking-widest">{key}</div>
                        <div className="text-2xl font-black text-purple-400">{String(val)}</div>
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

             {/* VI. 10X Upgrade: Future Sandbox (Conditional) */}
             {result.projections && (
               <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1s' }}>
                  <h3 className="text-3xl font-black text-green-400 flex items-center gap-4">
                     <span className="bg-green-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-green-500/30">VI</span>
                     FUTURE SANDBOX: 12-MONTH TRAJECTORY
                  </h3>
                  <div className="glass-card !bg-green-500/5 border-green-500/20">
                    <p className="text-sm text-gray-400 mb-8 italic">{result.projections.summary}</p>
                    <div className="h-64 w-full relative group">
                      <svg viewBox="0 0 1200 300" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path 
                          d={`M 0 300 ${result.projections.dataPoints.map((p: any, i: number) => `L ${i * 109} ${300 - (p.revenue / Math.max(...result.projections.dataPoints.map((dp:any) => dp.revenue || 1))) * 250}`).join(' ')} L 1100 300 Z`}
                          fill="url(#lineGrad)"
                        />
                        <path 
                          d={`M 0 300 ${result.projections.dataPoints.map((p: any, i: number) => `L ${i * 109} ${300 - (p.revenue / Math.max(...result.projections.dataPoints.map((dp:any) => dp.revenue || 1))) * 250}`).join(' ')}`}
                          fill="none" stroke="#22c55e" strokeWidth="4" className="drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        />
                      </svg>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                       {result.projections.dataPoints.slice(-4).map((p: any, i: number) => (
                         <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-[10px] text-gray-500 uppercase block mb-1">Month {p.month} Rev</span>
                            <span className="text-xl font-black text-green-400">${p.revenue?.toLocaleString()}</span>
                            <p className="text-[9px] text-gray-500 mt-2 truncate">{p.milestone}</p>
                         </div>
                       ))}
                    </div>
                  </div>
               </section>
             )}

             {/* VII. 10X Upgrade: Tactical Blitz Plan (Conditional) */}
             {result.blueprint && (
                <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1.2s' }}>
                   <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                      <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">VII</span>
                      TACTICAL 30-DAY BLITZ PLAN
                   </h3>
                   <div className="grid lg:grid-cols-4 gap-4">
                      {result.blueprint.weeks.map((w: any) => (
                        <div key={w.week} className="glass-card border-t-4 border-purple-500">
                           <h4 className="text-lg font-black text-white mb-2 underline decoration-purple-500/50">WEEK {w.week}</h4>
                           <p className="text-[10px] text-purple-400 uppercase font-black mb-4">{w.focus}</p>
                           <ul className="space-y-4">
                              {w.tasks.map((t: any, idx: number) => (
                                <li key={idx} className="group cursor-pointer">
                                   <div className="flex gap-3">
                                      <span className="w-5 h-5 flex-shrink-0 border border-white/20 rounded flex items-center justify-center text-[10px] group-hover:bg-purple-500 group-hover:border-purple-500 transition-all font-bold">{t.day}</span>
                                      <p className="text-xs text-gray-300 leading-tight group-hover:text-white transition-colors">{t.task}</p>
                                   </div>
                                </li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                </section>
             )}

             {/* VIII. 10X Upgrade: Strategic Pivot Engine (Conditional) */}
             {result.pivots && (
               <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1.4s' }}>
                  <div className="p-1 text-center bg-red-500/20 rounded-t-2xl border-t border-x border-red-500/30">
                    <p className="text-[10px] font-black tracking-[1em] uppercase py-2">Failure Vector Detected — Initiating Pivot Engine</p>
                  </div>
                  <h3 className="text-3xl font-black text-red-500 flex items-center gap-4">
                     <span className="bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/30">VIII</span>
                     STRATEGIC PIVOT ENGINE
                  </h3>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {result.pivots.map((p: any, i: number) => (
                      <div key={i} className="glass-card border-l-4 border-red-500 !bg-red-500/5 hover:!bg-red-500/10 transition-all">
                        <h4 className="text-xl font-black text-white mb-2">{renderSafe(p.name)}</h4>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-black uppercase mb-4 inline-block">{renderSafe(p.shift)}</span>
                        <p className="text-sm text-gray-300 mb-4 italic font-medium">"{renderSafe(p.logic)}"</p>
                        <div className="pt-4 border-t border-red-500/20">
                          <p className="text-[10px] text-red-400 uppercase font-black mb-1">New Opportunity</p>
                          <p className="text-xs text-white font-bold">{renderSafe(p.opportunity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* IX. 10X Upgrade: Coroner's Case Files (Conditional) */}
             {result.coronerReport && (
               <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1.6s' }}>
                  <h3 className="text-3xl font-black text-gray-400 flex items-center gap-4">
                     <span className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-lg border border-white/30 font-serif">†</span>
                     THE CORONER'S CASE FILES
                  </h3>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {result.coronerReport.map((c: any, i: number) => (
                      <div key={i} className="glass-card border-l-4 border-gray-600 !bg-white/5 hover:!bg-white/10 transition-all">
                        <h4 className="text-xl font-black text-white mb-2 uppercase">{renderSafe(c.company)}</h4>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                          <p className="text-[10px] text-red-500 uppercase font-bold mb-1">Fatal Mistake</p>
                          <p className="text-xs text-red-100 font-medium leading-tight">{renderSafe(c.mistake)}</p>
                        </div>
                        <p className="text-sm text-gray-300 mb-6 italic">
                          <span className="text-gray-500 font-bold uppercase text-[9px] block mb-1">Echo Logic:</span>
                          "{renderSafe(c.echo)}"
                        </p>
                        <div className="pt-4 border-t border-white/5">
                          <p className="text-[10px] text-green-400 uppercase font-black mb-1">The Vaccine</p>
                          <p className="text-xs text-white font-bold">{renderSafe(c.vaccine)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* X. 10X Upgrade: Stress Test Module */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '1.8s' }}>
                <h3 className="text-3xl font-black text-orange-500/50 flex items-center gap-4">
                   <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30">X</span>
                   INTERACTIVE STRESS TEST
                </h3>
                <div className="glass-card border-2 border-dashed border-white/10 !bg-transparent text-center p-12">
                   <h4 className="text-xl font-black text-white mb-4">Challenge the Audit</h4>
                   <p className="text-sm text-gray-400 mb-8 max-w-xl mx-auto">Found a pivot? Got more funding? Propose a change and see how it shifts your survival probability.</p>
                   <div className="flex gap-4 max-w-2xl mx-auto">
                      <input 
                        type="text" 
                        placeholder="e.g. 'What if I pivot to B2B enterprise sales?'"
                        value={stressTestInput}
                        onChange={(e) => setStressTestInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-black uppercase text-xs focus:border-orange-500 transition-all"
                      />
                      <button 
                        onClick={async () => {
                           const res = await actions.runStressTest(idea.name, stressTestInput, result.evidenceVault);
                           setStressTestResult(res);
                        }}
                        className="px-8 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-orange-400 transition-all font-bold"
                      >
                        Fire Stress Test
                      </button>
                   </div>
                   {stressTestResult && (
                      <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-orange-500/30 animate-scale-in text-left">
                         <div className="flex justify-between items-center mb-4">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${stressTestResult.impact === 'Positive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                               IMPACT: {stressTestResult.impact}
                            </span>
                            <span className="text-2xl font-black text-white">Delta: {stressTestResult.delta > 0 ? '+' : ''}{stressTestResult.delta}%</span>
                         </div>
                         <p className="text-sm text-gray-300 leading-relaxed italic">"{renderSafe(stressTestResult.logic)}"</p>
                      </div>
                   )}
                </div>
             </section>

              {/* XI. Final Committee Resolution */}
             <section className="space-y-8 animate-slide-up" style={{ animationDelay: '2s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">XI</span>
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
                  onClick={() => {setResult(null); setPhase(-1); setShowFullReport(false); setChallenges(null); setRawData({}); setStressTestResult(null);}}
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
