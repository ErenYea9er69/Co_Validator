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
  
  // Background data for interrogation and pre-mortem results
  const [challenges, setChallenges] = useState<any>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-10), msg]);

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setChallenges(null);
    setShowFullReport(false);
    setLogs(['Initiating engines...']);
    
    try {
      // 1. Problem Reality
      setPhase(1);
      setPhaseName('Problem Reality');
      addLog('Searching for real-world pain markers...');
      const p1 = await actions.runPhase1Problem(idea, "Initial Scan");
      addLog('Problem reality check complete.');

      // 2. Competitors
      setPhase(2);
      setPhaseName('Competitor Investigation');
      addLog('Scanning the direct and hidden landscape...');
      const p2 = await actions.runPhase2Competitors(idea, idea.competitorsInfo);
      addLog('Competitor scan complete.');

      // 3. Competition Saturation
      setPhase(3);
      setPhaseName('Competition Saturation');
      addLog('Analyzing market density...');
      const p3 = await actions.runPhase3Competition(idea, p2.raw);
      addLog('Saturation analysis complete.');

      // 4. Build Feasibility
      setPhase(4);
      setPhaseName('Build Feasibility');
      addLog('Evaluating complexity vs founder profile...');
      const p4 = await actions.runPhase4Feasibility(idea, founderDNA);
      addLog('Feasibility study complete.');

      // 5. Market & Monetization
      setPhase(5);
      setPhaseName('Market & Monetization');
      addLog('Simulating pricing and unit economics...');
      const p5 = await actions.runPhase5Market(idea);
      addLog('Market simulation complete.');

      // 6. Differentiation
      setPhase(6);
      setPhaseName('Differentiation');
      addLog('Hunting for asymmetric advantages...');
      const p6 = await actions.runPhase6Differentiation(idea, p2.raw);
      addLog('Differentiation report generated.');

      // ═══ AUTONOMOUS INTERROGATION (BACKGROUND) ═══
      setPhase(6.5);
      setPhaseName('The Interrogation (BG)');
      addLog('Consulting pattern matching algorithms for hidden risks...');
      const interrogationData = await actions.runInterrogation(idea, founderDNA);
      addLog('Deep risks identified.');

      // ═══ AUTONOMOUS PRE-MORTEM (BACKGROUND) ═══
      setPhase(6.8);
      setPhaseName('Survival Simulation (BG)');
      addLog('Simulating critical failure vectors...');
      const preMortemData = await actions.runPreMortem(idea, founderDNA);
      setChallenges({ interrogation: interrogationData, preMortem: preMortemData });
      addLog('Failure vectors mapped.');

      // 7. Failure Scenarios
      setPhase(7);
      setPhaseName('Final Stress Test');
      addLog('Synthesizing background simulations into stress test...');
      const p7 = await actions.runPhase7Failures(idea, preMortemData, { p1, p2, p3, p4, p5, p6 });
      addLog('Stress test complete.');

      // 8. Final Scoring
      setPhase(8);
      setPhaseName('Final Scoring');
      addLog('Synthesizing Master Verdict...');
      // Pass the background data as "responses" to skip the manual interaction
      const finalResult = await actions.finalizeAudit(idea, interrogationData, preMortemData, { p1, p2, p3, p4, p5, p6, p7 }, founderDNA);
      
      setResult(finalResult);
      setPhase(10); // Finished
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
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)] text-white font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {!showFullReport && (
          <header className="mb-16 text-center animate-fade-in">
            <h1 className="text-6xl font-black mb-4 tracking-tighter">
              CO<span className="text-purple-500">VALIDATOR</span>
              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded ml-2 uppercase tracking-widest align-middle">Deep Audit</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
              "The Silicon Valley Blitz-Auditor" — End-to-end autonomous simulation.
            </p>
          </header>
        )}

        {/* Input Form */}
        {!result && phase === -1 && !showFullReport && (
          <div className="max-w-2xl mx-auto glass-card animate-fade-in">
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
                    placeholder="e.g. Fintech"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Problem</label>
                <textarea 
                  value={idea.problem}
                  onChange={(e) => setIdea({...idea, problem: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="What pain point are you solving?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Solution</label>
                <textarea 
                  value={idea.solution}
                  onChange={(e) => setIdea({...idea, solution: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="How does your tech fix it?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Competitors (Optional)</label>
                <textarea 
                  value={idea.competitorsInfo}
                  onChange={(e) => setIdea({...idea, competitorsInfo: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="Who are they? Where are they strong? How will you beat them?"
                />
              </div>
              <button 
                type="submit" 
                className="w-full btn-premium"
              >
                START AUTONOMOUS AUDIT
              </button>
            </form>
          </div>
        )}

        {/* Loading / Progress State */}
        {loading && !showFullReport && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-20 animate-fade-in">
            <div className="relative inline-block">
              <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">
                {Math.round((phase / 8) * 100)}%
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">
                {phase >= 0 && phase < 10 ? `Phase ${Math.floor(phase)}: ${phaseName}` : 'Finalizing...'}
              </h3>
              <p className="text-gray-400 italic">Engaging AI pattern matching and real-time market research...</p>
            </div>
            <div className="glass-card text-left bg-black text-xs font-mono p-4 opacity-70">
              {logs.map((log, i) => <div key={i} className="mb-1">{`> ${log}`}</div>)}
            </div>
          </div>
        )}

        {/* Final Result Display */}
        {result && (
          <div className="animate-fade-in">
            {/* Toggle Report Mode */}
            <div className="mb-8 flex justify-end gap-4 print:hidden">
              <button 
                onClick={() => setShowFullReport(!showFullReport)}
                className="px-6 py-2 border border-purple-500/50 rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-500/10 transition-all"
              >
                {showFullReport ? 'View Scoreboard' : 'View Full Report'}
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-2 border border-white/20 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Print Report
              </button>
              <button 
                onClick={downloadJSON}
                className="px-6 py-2 bg-purple-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-purple-600 transition-all"
              >
                Download Data
              </button>
            </div>

            {!showFullReport ? (
              <div className="space-y-12">
                {/* Scoreboard View */}
                <div className="glass-card !bg-purple-900/10 border-purple-500/50 p-10 text-center">
                  <div className="flex justify-center gap-4 mb-6 flex-wrap">
                      {Object.entries(result.compositeScores || {}).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="px-6 py-2 glass rounded-full">
                          <span className="text-[10px] uppercase text-gray-500 block">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="text-xl font-black">{String(value)}%</span>
                        </div>
                      ))}
                  </div>
                  <h3 className="text-5xl font-black mb-6 italic leading-tight max-w-4xl mx-auto">"{result.verdictLabel || result.reasoning?.substring(0, 100) + '...'}"</h3>
                  <div className="flex justify-center">
                      <span className={`px-6 py-2 rounded-full font-black tracking-widest uppercase border ${
                        result.verdict === '🚀' || result.verdict === 'highly_promising' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                        result.verdict === '❌' || result.verdict === 'kill' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                      }`}>
                        Verdict: {result.verdict}
                      </span>
                  </div>
                </div>

                {/* Dimension Scores */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <section className="glass-card">
                    <h4 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 text-purple-400">Dimension Heatmap</h4>
                    <div className="space-y-6">
                        {result.scores && Object.entries(result.scores).map(([name, score]: [string, any]) => (
                          <div key={name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-bold text-gray-300">{name.toUpperCase()}</span>
                              <span className="font-black text-purple-400">{score}/10</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${Number(score) * 10}%` }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </section>

                  {/* Signals */}
                  <div className="space-y-8">
                    <div className="glass-card">
                      <h4 className="text-xs font-bold text-purple-400 uppercase mb-4">Master Reasoning</h4>
                      <p className="text-sm text-gray-400 leading-relaxed italic">{result.reasoning}</p>
                    </div>
                    
                    {/* Critical Challenges Section */}
                    {challenges && (
                      <div className="glass-card border-l-4 border-orange-500 bg-orange-500/5">
                        <h4 className="text-xs font-bold text-orange-500 uppercase mb-4">Identified Critical Challenges</h4>
                        <div className="space-y-4">
                          {challenges.interrogation?.questions?.slice(0, 2).map((q: any, i: number) => (
                            <div key={i} className="text-sm">
                              <p className="font-bold text-gray-200">Challenge: {q.question}</p>
                              {q.conflictNugget && <p className="text-xs text-red-400 mt-1 italic">Vulnerability: {q.conflictNugget}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="glass-card border-l-4 border-red-500">
                        <h4 className="text-xs font-bold text-red-500 uppercase mb-4">Critical Vulnerabilities</h4>
                        <ul className="space-y-2">
                            {result.expertSignals?.red?.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">⚠️ {r}</li>
                            ))}
                        </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Report View */
              <div className="space-y-12 pb-24 animate-fade-in">
                <div className="text-center mb-16">
                   <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">FULL AUDIT DOSSIER: {idea.name}</h2>
                   <p className="text-gray-500 uppercase tracking-[0.5em]">Confidential Background Investigation</p>
                </div>

                {/* Section: Challenge & Defense Logic */}
                <section className="space-y-6">
                  <h3 className="text-2xl font-black text-purple-400 border-b border-white/10 pb-2">I. AUTOMATED INTERROGATION FINDINGS</h3>
                  <div className="grid gap-6">
                    {challenges?.interrogation?.questions?.map((q: any, i: number) => (
                      <div key={i} className="glass-card !bg-white/5">
                        <h4 className="text-sm font-black text-purple-400 mb-2">RISK VECTOR {i+1}</h4>
                        <p className="text-lg font-bold mb-2">{q.question}</p>
                        <p className="text-sm text-gray-400 italic">{q.conflictNugget}</p>
                      </div>
                    ))}
                    <div className="glass-card bg-purple-900/5 mt-4">
                      <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Background Resolution</h4>
                      <p className="text-lg leading-relaxed">{result.conflictResolution || "Simulation resolved all internal logic conflicts."}</p>
                    </div>
                  </div>
                </section>

                {/* Section: Survival Simulation */}
                <section className="space-y-6">
                  <h3 className="text-2xl font-black text-orange-400 border-b border-white/10 pb-2">II. SURVIVAL SIMULATION (PRE-MORTEM)</h3>
                  <div className="grid lg:grid-cols-2 gap-8">
                    {challenges?.preMortem?.scenarios?.map((s: any, i: number) => (
                      <div key={i} className="glass-card border border-orange-500/20">
                        <h4 className="text-xs font-black text-orange-500 mb-2 uppercase">Scenario {i+1}</h4>
                        <p className="text-sm text-gray-300 leading-relaxed font-bold">{s.scenario}</p>
                        <p className="text-xs text-red-400 mt-2 italic">Fatal Flaw: {s.fatalFlaw}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Section: Market Intelligence */}
                <section className="space-y-6">
                  <h3 className="text-2xl font-black text-purple-400 border-b border-white/10 pb-2">III. MARKET INTELLIGENCE</h3>
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="glass-card">
                      <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Billion Dollar Trajectory</h4>
                      <p className="text-gray-300 leading-relaxed font-bold">{result.futureSandbox?.billionDollarPath || "N/A"}</p>
                    </div>
                    <div className="glass-card">
                      <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">The Zombie Trap</h4>
                      <p className="text-gray-300 leading-relaxed font-bold">{result.futureSandbox?.zombiePath || "N/A"}</p>
                    </div>
                  </div>
                </section>

                {/* Section: Unit Economics */}
                <section className="space-y-6">
                  <h3 className="text-2xl font-black text-purple-400 border-b border-white/10 pb-2">IV. UNIT ECONOMICS SIMULATION</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     {Object.entries(result.unitEconomicsReality || {}).map(([key, val]) => (
                       <div key={key} className="glass-card text-center !bg-white/5">
                         <div className="text-[10px] text-gray-500 uppercase mb-2">{key}</div>
                         <div className="text-2xl font-black text-purple-400">{String(val)}</div>
                       </div>
                     ))}
                  </div>
                </section>

                {/* Footer / Reset */}
                <div className="pt-12 text-center print:hidden">
                   <button 
                     onClick={() => {setResult(null); setPhase(-1); setShowFullReport(false); setChallenges(null);}}
                     className="px-12 py-4 border border-white/10 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase text-xs font-black tracking-widest"
                   >
                     Reset Auditor Database
                   </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
