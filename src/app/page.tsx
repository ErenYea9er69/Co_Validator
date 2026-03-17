'use client';

import { useState, useEffect } from 'react';
import * as actions from './actions';

// ─── Input Quality Helper ───
function getInputQuality(text: string, minGood: number = 80): { level: 'red' | 'yellow' | 'green'; label: string } {
  const len = text.trim().length;
  if (len < 30) return { level: 'red', label: 'Too thin — be specific' };
  if (len < minGood) return { level: 'yellow', label: 'Add more detail' };
  return { level: 'green', label: 'Good depth' };
}

const qualityColors = { red: 'bg-red-500', yellow: 'bg-yellow-500', green: 'bg-green-500' };

export default function Home() {
  const [idea, setIdea] = useState({
    name: '', problem: '', solution: '', industry: '', monetization: '', competitorsInfo: ''
  });

  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<number>(-1);
  const [phaseName, setPhaseName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [challenges, setChallenges] = useState<any>(null);
  const [stressTestInput, setStressTestInput] = useState('');
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  const [showVault, setShowVault] = useState(false);
  const [rawData, setRawData] = useState<any>({});
  const [failedPhases, setFailedPhases] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-12), msg]);

  // ─── localStorage persistence ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem('co-validator-audit');
      if (saved) {
        const { result: r, rawData: rd, challenges: ch, idea: id } = JSON.parse(saved);
        if (r) { setResult(r); setRawData(rd || {}); setChallenges(ch || null); setIdea(id); setPhase(10); }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (result && phase === 10) {
      try {
        localStorage.setItem('co-validator-audit', JSON.stringify({ result, rawData, challenges, idea }));
      } catch {}
    }
  }, [result, rawData, challenges, idea, phase]);

  const clearSaved = () => { localStorage.removeItem('co-validator-audit'); };

  const renderSafe = (val: any): string => {
    if (!val) return "";
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) return val.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join(', ');
    if (typeof val === 'object') return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
    return String(val);
  };

  // ─── Audit orchestrator with per-phase error resilience ───
  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setResult(null); setChallenges(null); setRawData({}); setShowFullReport(false);
    setStressTestResult(null); setFailedPhases([]); setLogs(['Initiating engines...']);

    const evidence: Record<string, any[]> = {};
    let p1: any = null, p2: any = null, p3: any = null, p4: any = null, p5: any = null, p6: any = null, p7: any = null;
    let interrogationData: any = null, preMortemData: any = null;
    const failed: string[] = [];

    // Phase 1
    try {
      setPhase(1); setPhaseName('Problem Reality'); addLog('Searching for real-world pain markers...');
      p1 = await actions.runPhase1Problem(idea, "Initial Scan");
      setRawData((prev: any) => ({ ...prev, p1 }));
      if (p1.searchResults) evidence['problem_evidence'] = p1.searchResults;
      addLog('Problem reality check complete.');
    } catch (err) { failed.push('Problem Reality'); addLog('⚠️ Phase 1 failed — continuing...'); }

    // Phase 2
    try {
      setPhase(2); setPhaseName('Competitor Investigation'); addLog('Scanning the competitive landscape...');
      p2 = await actions.runPhase2Competitors(idea, idea.competitorsInfo);
      setRawData((prev: any) => ({ ...prev, p2 }));
      if (p2.searchResults) evidence['competitor_scan'] = p2.searchResults;
      addLog('Competitor scan complete.');
    } catch (err) { failed.push('Competitor Investigation'); addLog('⚠️ Phase 2 failed — continuing...'); }

    // Phase 3
    try {
      setPhase(3); setPhaseName('Competition Saturation'); addLog('Analyzing market density...');
      p3 = await actions.runPhase3Competition(idea, p2?.raw || '');
      setRawData((prev: any) => ({ ...prev, p3 }));
      addLog('Saturation analysis complete.');
    } catch (err) { failed.push('Competition Saturation'); addLog('⚠️ Phase 3 failed — continuing...'); }

    // Phase 4
    try {
      setPhase(4); setPhaseName('Build Feasibility'); addLog('Evaluating complexity...');
      p4 = await actions.runPhase4Feasibility(idea, { skills: ['General'], budget: 'Bootstrap', timeCommitment: 'Full-time' });
      setRawData((prev: any) => ({ ...prev, p4 }));
      addLog('Feasibility study complete.');
    } catch (err) { failed.push('Build Feasibility'); addLog('⚠️ Phase 4 failed — continuing...'); }

    // Phase 5
    try {
      setPhase(5); setPhaseName('Market & Monetization'); addLog('Simulating pricing and unit economics...');
      p5 = await actions.runPhase5Market(idea);
      setRawData((prev: any) => ({ ...prev, p5 }));
      if (p5.searchResults) evidence['pricing_research'] = p5.searchResults;
      addLog('Market simulation complete.');
    } catch (err) { failed.push('Market & Monetization'); addLog('⚠️ Phase 5 failed — continuing...'); }

    // Phase 6
    try {
      setPhase(6); setPhaseName('Differentiation'); addLog('Hunting for asymmetric advantages...');
      p6 = await actions.runPhase6Differentiation(idea, p2?.raw || '');
      setRawData((prev: any) => ({ ...prev, p6 }));
      addLog('Differentiation report generated.');
    } catch (err) { failed.push('Differentiation'); addLog('⚠️ Phase 6 failed — continuing...'); }

    // Interrogation
    try {
      setPhase(6.5); setPhaseName('Deep Interrogation'); addLog('Consulting pattern matching...');
      interrogationData = await actions.runInterrogation(idea, { skills: ['General'], budget: 'Bootstrap', timeCommitment: 'Full-time' });
      addLog('Deep risks identified.');
    } catch (err) { failed.push('Interrogation'); addLog('⚠️ Interrogation failed — continuing...'); }

    // Pre-Mortem
    try {
      setPhase(6.8); setPhaseName('Survival Simulation'); addLog('Simulating critical failure vectors...');
      preMortemData = await actions.runPreMortem(idea, { skills: ['General'], budget: 'Bootstrap', timeCommitment: 'Full-time' });
      setChallenges({ interrogation: interrogationData, preMortem: preMortemData });
      addLog('Failure vectors mapped.');
    } catch (err) { failed.push('Pre-Mortem'); addLog('⚠️ Pre-Mortem failed — continuing...'); }

    // Phase 7
    try {
      setPhase(7); setPhaseName('Expert Stress Test');
      p7 = await actions.runPhase7Failures(idea, preMortemData, { p1, p2, p3, p4, p5, p6 });
      setRawData((prev: any) => ({ ...prev, p7 }));
      addLog('Stress test complete.');
    } catch (err) { failed.push('Expert Stress Test'); addLog('⚠️ Phase 7 failed — continuing...'); }

    // Final Scoring
    try {
      setPhase(8); setPhaseName('Final Scoring'); addLog('Synthesizing Master Verdict...');
      const finalResult = await actions.finalizeAudit(idea, interrogationData, preMortemData, { p1, p2, p3, p4, p5, p6, p7 }, null, evidence);
      setResult(finalResult);
      setPhase(10);
    } catch (err) {
      addLog('❌ Final scoring failed.');
      failed.push('Final Scoring');
    }

    setFailedPhases(failed);
    setLoading(false);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ idea, result, rawData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `audit_${idea.name.replace(/\s+/g, '_')}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ─── Input quality indicators ───
  const problemQ = getInputQuality(idea.problem);
  const solutionQ = getInputQuality(idea.solution);
  const competitorsQ = getInputQuality(idea.competitorsInfo, 50);
  const overallReady = idea.name.length > 1 && idea.industry.length > 1 && problemQ.level !== 'red' && solutionQ.level !== 'red';

  return (
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)] text-white font-sans scroll-smooth print:bg-white print:text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!showFullReport && (
          <header className="mb-16 text-center animate-fade-in print:hidden">
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

        {/* Failed Phases Banner */}
        {failedPhases.length > 0 && result && !showFullReport && (
          <div className="max-w-4xl mx-auto mb-8 glass-card border-orange-500/50 !bg-orange-500/5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="text-lg font-black text-orange-400 uppercase">Partial Audit — {failedPhases.length} Phase(s) Failed</h3>
            </div>
            <p className="text-sm text-gray-400">The following phases encountered errors and their data is unavailable: <span className="text-orange-300 font-bold">{failedPhases.join(', ')}</span>. Scores may be less accurate.</p>
          </div>
        )}

        {/* Input Form with Quality Coaching */}
        {!result && phase === -1 && !showFullReport && (
          <div className="max-w-2xl mx-auto glass-card animate-fade-in shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Initialize Idea</h2>
            <form onSubmit={startAudit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Startup Name</label>
                  <input type="text" value={idea.name} onChange={(e) => setIdea({...idea, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all" placeholder="e.g. Acme AI" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
                  <input type="text" value={idea.industry} onChange={(e) => setIdea({...idea, industry: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all" placeholder="e.g. FoodTech" required />
                </div>
              </div>

              {/* Problem — with quality meter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-400">The Problem (Be Specific)</label>
                  <span className={`text-[10px] font-black uppercase ${problemQ.level === 'green' ? 'text-green-400' : problemQ.level === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{problemQ.label}</span>
                </div>
                <textarea value={idea.problem} onChange={(e) => setIdea({...idea, problem: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="Describe the deep pain you're solving. Include who feels it, how often, and what they currently do about it." required />
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${qualityColors[problemQ.level]} transition-all duration-500`} style={{ width: `${Math.min(idea.problem.length / 1.5, 100)}%` }} />
                </div>
              </div>

              {/* Solution — with quality meter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-400">The Solution & Key Features</label>
                  <span className={`text-[10px] font-black uppercase ${solutionQ.level === 'green' ? 'text-green-400' : solutionQ.level === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{solutionQ.label}</span>
                </div>
                <textarea value={idea.solution} onChange={(e) => setIdea({...idea, solution: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="How does it work? List 3-5 core features. What makes it different from existing tools?" required />
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${qualityColors[solutionQ.level]} transition-all duration-500`} style={{ width: `${Math.min(idea.solution.length / 1.5, 100)}%` }} />
                </div>
              </div>

              {/* Competitors — with quality meter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-400">Strategy & Competitors (Crucial)</label>
                  <span className={`text-[10px] font-black uppercase ${competitorsQ.level === 'green' ? 'text-green-400' : competitorsQ.level === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{competitorsQ.label}</span>
                </div>
                <textarea value={idea.competitorsInfo} onChange={(e) => setIdea({...idea, competitorsInfo: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="Who are the incumbents? How will you beat them? What is your revenue model? (e.g. Freemium, SaaS $20/mo)" />
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full ${qualityColors[competitorsQ.level]} transition-all duration-500`} style={{ width: `${Math.min(idea.competitorsInfo.length / 1, 100)}%` }} />
                </div>
              </div>

              {/* Pre-flight warning */}
              {!overallReady && (idea.problem.length > 0 || idea.solution.length > 0) && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <span className="text-lg">🛑</span> Your input is too thin for a reliable audit. Add more detail to the Problem and Solution fields to avoid wasting credits on speculation.
                </div>
              )}

              <button type="submit" disabled={!overallReady} className={`w-full py-4 font-black rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${overallReady ? 'btn-premium' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}>
                {overallReady ? 'START DEEP AUDIT' : 'ADD MORE DETAIL TO START'}
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
                {phase >= 0 && phase < 10 ? `Phase ${Math.floor(phase)}: ${phaseName}` : 'Finalizing...'}
              </h3>
              <p className="text-gray-400 italic">Executing cross-dimension validation...</p>
            </div>
            <div className="glass-card text-left bg-black text-xs font-mono p-4 opacity-70 border-white/5 shadow-inner max-h-48 overflow-y-auto">
              {logs.map((log, i) => <div key={i} className={`mb-1 ${log.startsWith('⚠️') ? 'text-orange-400' : log.startsWith('❌') ? 'text-red-400' : 'text-purple-300'}`}>{`> ${log}`}</div>)}
            </div>
          </div>
        )}

        {/* Result Header Buttons */}
        {result && (
          <div className="flex justify-end gap-4 print:hidden mb-8 animate-fade-in flex-wrap">
             <button onClick={() => setShowFullReport(!showFullReport)}
                className="px-6 py-2 border border-purple-500 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-500/10 transition-all text-purple-400">
                {showFullReport ? 'View Scoreboard' : 'View Full Dossier'}
             </button>
             <button onClick={() => window.print()}
                className="px-6 py-2 border border-white/20 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-400">
                Export PDF
             </button>
             <button onClick={downloadJSON}
                className="px-6 py-2 bg-purple-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/40">
                Export JSON
             </button>
          </div>
        )}

        {/* SCOREBOARD VIEW */}
        {result && !showFullReport && (
          <div className="animate-fade-in space-y-12">
            <div className="glass-card !bg-purple-900/10 border-purple-500/50 p-10 text-center shadow-2xl print:shadow-none print:border print:border-gray-300">
              <div className="flex justify-center gap-6 mb-8 flex-wrap">
                  {Object.entries(result.compositeScores || {}).slice(0, 5).map(([key, value]) => (
                    <div key={key} className="px-6 py-3 glass rounded-xl border border-white/5 flex flex-col items-center min-w-[120px] print:border-gray-300">
                      <span className="text-[10px] uppercase text-gray-400 font-black mb-1 tracking-widest print:text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-3xl font-black text-white print:text-black">{String(value)}%</span>
                    </div>
                  ))}
              </div>
              <h3 className="text-5xl lg:text-6xl font-black mb-8 italic leading-tight max-w-5xl mx-auto drop-shadow-lg text-white print:text-black print:drop-shadow-none">
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

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Dimension Heatmap with ALWAYS-VISIBLE explanations */}
              <section className="glass-card">
                <h4 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 text-purple-400 uppercase tracking-tighter print:text-purple-700">Dimension Heatmap</h4>
                <div className="space-y-6">
                    {result.scores && Object.entries(result.scores).map(([name, data]: [string, any]) => {
                      const score = Number(data.score || data);
                      return (
                        <div key={name}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-gray-300 tracking-wide uppercase print:text-gray-700">{name.replace(/_/g, ' ')}</span>
                            <span className={`font-black text-lg ${score <= 4 ? 'text-red-400' : score <= 6 ? 'text-yellow-400' : 'text-purple-400'}`}>{score}/10</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2 print:bg-gray-200">
                            <div className={`h-full transition-all duration-1000 ${score <= 4 ? 'bg-gradient-to-r from-red-800 to-red-500' : score <= 6 ? 'bg-gradient-to-r from-yellow-700 to-yellow-500' : 'bg-gradient-to-r from-purple-800 to-purple-500'}`} style={{ width: `${score * 10}%` }} />
                          </div>
                          {data.reason && (
                            <p className={`text-xs italic leading-snug mb-1 ${score <= 5 ? 'text-red-300 font-medium' : 'text-gray-500'}`}>{data.reason}</p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>

              <div className="space-y-8">
                <div className="glass-card bg-purple-500/5">
                  <h4 className="text-xs font-black text-purple-400 uppercase mb-4 tracking-widest">Master Reasoning</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">{result.reasoning}</p>
                </div>
                
                {challenges && (
                  <div className="glass-card border-l-4 border-orange-500 bg-orange-500/5">
                    <h4 className="text-xs font-black text-orange-500 uppercase mb-4 tracking-widest">Critical Challenges</h4>
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
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-3"><span className="text-green-500 font-bold">✓</span> {renderSafe(r)}</li>
                          ))}
                      </ul>
                  </div>
                  <div className="glass-card border-l-4 border-red-500 bg-red-500/5">
                      <h4 className="text-xs font-black text-red-500 uppercase mb-4 tracking-widest">Critical Vulnerabilities</h4>
                      <ul className="space-y-3">
                          {result.expertSignals?.red?.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-3"><span className="text-red-500 font-bold">⚠️</span> {renderSafe(r)}</li>
                          ))}
                      </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL DOSSIER VIEW — continued in next section */}
        {result && showFullReport && (
          <div className="animate-fade-in space-y-20 pb-24 dossier-view relative print:space-y-8">
             {/* Dossier Header */}
             <div className="glass-card p-12 bg-purple-500/5 border-purple-500/30 text-center print:bg-white print:border print:border-purple-300">
                <h2 className="text-5xl font-black mb-2 uppercase tracking-tighter text-white leading-none print:text-black">DOSSIER: {idea.name}</h2>
                <div className="h-1 w-20 bg-purple-500 mx-auto mb-4" />
                <p className="text-gray-500 uppercase tracking-widest text-xs font-black">Due Diligence Report • {new Date().toLocaleDateString()}</p>
             </div>

             {/* Evidence Vault Toggle */}
             <button onClick={() => setShowVault(true)}
                className="fixed right-8 bottom-8 z-50 px-6 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-4 border-black group print:hidden">
                <span className="bg-black text-white w-5 h-5 flex items-center justify-center rounded-full group-hover:rotate-12 transition-transform">i</span>
                Evidence Vault
             </button>

             {/* Sliding Vault Panel */}
             {showVault && (
               <div className="fixed inset-0 z-[100] flex justify-end print:hidden">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowVault(false)} />
                  <div className="w-full max-w-xl h-full bg-[#0a0a0a] border-l border-white/10 p-12 overflow-y-auto animate-slide-in-right relative">
                     <button onClick={() => setShowVault(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white font-black">CLOSE [X]</button>
                     <h3 className="text-3xl font-black text-white mb-8 underline decoration-purple-500">THE EVIDENCE VAULT</h3>
                     <div className="space-y-12">
                        {Object.entries(result.evidenceVault || {}).map(([phaseName, data]: any) => (
                           Array.isArray(data) && data.length > 0 && (
                           <div key={phaseName} className="space-y-4">
                              <h4 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{phaseName.replace(/_/g, ' ')}</h4>
                              <div className="grid gap-3">
                                 {data.map((res: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                                       <p className="text-[10px] text-gray-500 mb-1 uppercase font-bold">{(() => { try { return new URL(res.url).hostname; } catch { return 'Source'; } })()}</p>
                                       <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-white hover:text-purple-400 leading-tight block mb-2">{res.title || 'Untitled'}</a>
                                       <p className="text-xs text-gray-400 line-clamp-2 italic">"{res.content || res.snippet || ''}"</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                           )
                        ))}
                        {Object.keys(result.evidenceVault || {}).length === 0 && (
                          <p className="text-gray-500 italic text-sm">No raw evidence collected for this audit.</p>
                        )}
                     </div>
                  </div>
               </div>
             )}

             {/* I. Problem & Evidence */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid">
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">I</span>
                   PROBLEM & MARKET EVIDENCE
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card border border-white/5 space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Anthropological Evidence</h4>
                      <p className="text-lg text-gray-300 leading-relaxed font-medium italic print:text-gray-700">"{renderSafe(rawData.p1?.parsed?.reasoning) || "Data unavailable"}"</p>
                   </div>
                   <div className="glass-card border border-white/5">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Market Findings</h4>
                      <ul className="space-y-4">
                         {rawData.p1?.parsed?.verifyingEvidence?.map((e: any, i: number) => (
                           <li key={i} className="text-sm text-gray-400 p-3 bg-white/5 rounded-lg border-l-2 border-purple-500">{renderSafe(e.fact || e)}</li>
                         )) || <li className="text-sm text-gray-500 italic">No evidence available</li>}
                      </ul>
                   </div>
                </div>
             </section>

             {/* II. Competitive Landscape */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
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
                                 <p className="font-black text-white text-lg print:text-black">{c.name}</p>
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
                      <p className="text-lg font-black mb-4 print:text-black">"{renderSafe(rawData.p3?.parsed?.saturationRisk) || "N/A"}"</p>
                      <p className="text-sm text-gray-400 leading-relaxed italic">{renderSafe(rawData.p3?.parsed?.brutalTruth)}</p>
                   </div>
                </div>
             </section>

             {/* III. Execution Dossier */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">III</span>
                   EXECUTION DOSSIER
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Feasibility Analysis</h4>
                      <p className="text-gray-300 leading-relaxed font-bold italic print:text-gray-700">"{renderSafe(rawData.p4?.parsed?.complexityAssessment) || "N/A"}"</p>
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
                      <p className="text-lg text-green-400 font-black mb-4 underline decoration-green-500/30 font-mono tracking-tighter uppercase">{renderSafe(rawData.p6?.parsed?.primaryAdvantage) || "N/A"}</p>
                      <p className="text-sm text-gray-400 italic">Strategy: {renderSafe(rawData.p6?.parsed?.differentiationStrategy)}</p>
                   </div>
                </div>
             </section>

             {/* IV. Economics */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
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

             {/* V. Angel of Death */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.8s' }}>
                <h3 className="text-3xl font-black text-orange-500 flex items-center gap-4">
                   <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30">V</span>
                   ANGEL OF DEATH: SURVIVAL SIMULATION
                </h3>
                <div className="grid lg:grid-cols-2 gap-8">
                   {challenges?.preMortem?.scenarios?.map((s: any, i: number) => (
                      <div key={i} className="glass-card !bg-orange-500/5 border-orange-500/30">
                        <div className="flex justify-between items-start mb-6">
                           <h4 className="text-xs font-black text-orange-500 uppercase tracking-widest">Failure Vector {i+1}</h4>
                           <span className="text-xs px-3 py-1 bg-red-500/20 text-red-500 rounded-full font-black uppercase">CRITICAL</span>
                        </div>
                        <p className="text-xl font-black text-white leading-tight mb-4 italic print:text-black">"{s.scenario}"</p>
                        <div className="pt-4 border-t border-orange-500/20">
                           <p className="text-sm text-red-400 font-bold uppercase mb-1 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse print:animate-none" /> Fatal Flaw</p>
                           <p className="text-gray-300 font-medium print:text-gray-700">{s.fatalFlaw}</p>
                        </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* VI. Future Sandbox */}
             {result.projections && (
               <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1s' }}>
                  <h3 className="text-3xl font-black text-green-400 flex items-center gap-4">
                     <span className="bg-green-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-green-500/30">VI</span>
                     FUTURE SANDBOX: 12-MONTH TRAJECTORY
                  </h3>
                  <div className="glass-card !bg-green-500/5 border-green-500/20">
                    <p className="text-sm text-gray-400 mb-8 italic">{result.projections.summary}</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                       {result.projections.dataPoints?.slice(-4).map((p: any, i: number) => (
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

             {/* VII. Tactical Blueprint */}
             {result.blueprint && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.2s' }}>
                   <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                      <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">VII</span>
                      TACTICAL 30-DAY BLITZ PLAN
                   </h3>
                   <div className="grid lg:grid-cols-4 gap-4">
                      {result.blueprint.weeks?.map((w: any) => (
                        <div key={w.week} className="glass-card border-t-4 border-purple-500">
                           <h4 className="text-lg font-black text-white mb-2 underline decoration-purple-500/50 print:text-black">WEEK {w.week}</h4>
                           <p className="text-[10px] text-purple-400 uppercase font-black mb-4">{w.focus}</p>
                           <ul className="space-y-4">
                              {w.tasks?.map((t: any, idx: number) => (
                                <li key={idx} className="group cursor-pointer">
                                   <div className="flex gap-3">
                                      <span className="w-5 h-5 flex-shrink-0 border border-white/20 rounded flex items-center justify-center text-[10px] font-bold">{t.day}</span>
                                      <p className="text-xs text-gray-300 leading-tight print:text-gray-700">{t.task}</p>
                                   </div>
                                </li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                </section>
             )}

             {/* VIII. Pivot Engine */}
             {result.pivots && (
               <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.4s' }}>
                  <div className="p-1 text-center bg-red-500/20 rounded-t-2xl border-t border-x border-red-500/30">
                    <p className="text-[10px] font-black tracking-[1em] uppercase py-2">Failure Vector Detected — Initiating Pivot Engine</p>
                  </div>
                  <h3 className="text-3xl font-black text-red-500 flex items-center gap-4">
                     <span className="bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/30">VIII</span>
                     STRATEGIC PIVOT ENGINE
                  </h3>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {(Array.isArray(result.pivots) ? result.pivots : result.pivots?.pivots || []).map((p: any, i: number) => (
                      <div key={i} className="glass-card border-l-4 border-red-500 !bg-red-500/5 hover:!bg-red-500/10 transition-all">
                        <h4 className="text-xl font-black text-white mb-2 print:text-black">{renderSafe(p.name)}</h4>
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-black uppercase mb-4 inline-block">{renderSafe(p.shift)}</span>
                        <p className="text-sm text-gray-300 mb-4 italic font-medium">"{renderSafe(p.logic)}"</p>
                        <div className="pt-4 border-t border-red-500/20">
                          <p className="text-[10px] text-red-400 uppercase font-black mb-1">New Opportunity</p>
                          <p className="text-xs text-white font-bold print:text-black">{renderSafe(p.opportunity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* IX. Coroner's Case Files */}
             {result.coronerReport && (
               <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.6s' }}>
                  <h3 className="text-3xl font-black text-gray-400 flex items-center gap-4">
                     <span className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-lg border border-white/30 font-serif">†</span>
                     THE CORONER'S CASE FILES
                  </h3>
                  <div className="grid lg:grid-cols-3 gap-6">
                    {(Array.isArray(result.coronerReport) ? result.coronerReport : []).map((c: any, i: number) => (
                      <div key={i} className="glass-card border-l-4 border-gray-600 !bg-white/5 hover:!bg-white/10 transition-all">
                        <h4 className="text-xl font-black text-white mb-2 uppercase print:text-black">{renderSafe(c.company)}</h4>
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
                          <p className="text-xs text-white font-bold print:text-black">{renderSafe(c.vaccine)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </section>
             )}

             {/* X. Stress Test */}
             <section className="space-y-8 animate-slide-up print:hidden" style={{ animationDelay: '1.8s' }}>
                <h3 className="text-3xl font-black text-orange-500/50 flex items-center gap-4">
                   <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30">X</span>
                   INTERACTIVE STRESS TEST
                </h3>
                <div className="glass-card border-2 border-dashed border-white/10 !bg-transparent text-center p-12">
                   <h4 className="text-xl font-black text-white mb-4">Challenge the Audit</h4>
                   <p className="text-sm text-gray-400 mb-8 max-w-xl mx-auto">Found a pivot? Got more funding? Propose a change and see how it shifts your survival probability.</p>
                   <div className="flex gap-4 max-w-2xl mx-auto">
                      <input type="text" placeholder="e.g. 'What if I pivot to B2B enterprise sales?'" value={stressTestInput} onChange={(e) => setStressTestInput(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white font-black uppercase text-xs focus:border-orange-500 transition-all" />
                      <button onClick={async () => {
                           const res = await actions.runStressTest(idea.name, stressTestInput, result.evidenceVault);
                           setStressTestResult(res);
                        }} className="px-8 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-orange-400 transition-all">
                        Fire
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

             {/* XI. Final Resolution */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">XI</span>
                   FINAL COMMITTEE RESOLUTION
                </h3>
                <div className="glass-card !bg-purple-500/5 border-purple-500/30">
                   <div className="grid lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h4 className="text-xs font-black text-orange-400 uppercase tracking-widest">Internal Conflict Resolution</h4>
                         <p className="text-lg leading-relaxed text-gray-300 font-bold italic print:text-gray-700">"{result.conflictResolution || "Simulation reached consensus."}"</p>
                      </div>
                      <div className="space-y-6">
                         <h4 className="text-xs font-black text-green-400 uppercase tracking-widest">Master Trajectory</h4>
                         <p className="text-2xl font-black text-white leading-tight mb-2 tracking-tighter uppercase print:text-black">{result.category || "General Admission"}</p>
                         <p className="text-sm text-gray-400 leading-relaxed italic">{result.reasoning}</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* Footer */}
             <div className="pt-12 text-center print:hidden pb-20">
                <button onClick={() => { setResult(null); setPhase(-1); setShowFullReport(false); setChallenges(null); setRawData({}); setStressTestResult(null); clearSaved(); }}
                  className="px-16 py-5 border border-white/10 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase text-xs font-black tracking-[0.5em] hover:border-purple-500/40">
                  Terminate Audit Instance
                </button>
             </div>
          </div>
        )}
      </div>
    </main>
  );
}
