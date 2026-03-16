'use client';

import { useState, useRef, useEffect } from 'react';
import { runDeepValidation, ValidationEvent } from '@/lib/deepValidator';

export default function Home() {
  const [idea, setIdea] = useState({
    name: '',
    problem: '',
    solution: '',
    industry: '',
    monetization: ''
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
  
  // Interactive Modal State
  const [modalType, setModalType] = useState<'interrogation' | 'pre-mortem' | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalInput, setModalInput] = useState<string[]>([]);
  const inputResolver = useRef<((value: any) => void) | null>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-10), msg]);

  const handleValidationEvent = (event: ValidationEvent) => {
    if (event.type === 'phase_start') {
      setPhase(event.phase ?? 0);
      setPhaseName(event.name ?? '');
      addLog(`Starting: ${event.name}`);
    } else if (event.type === 'phase_complete') {
      addLog(`Completed: ${event.name}`);
    }
  };

  const waitForInput = (type: 'interrogation' | 'pre-mortem', data: any) => {
    setModalType(type);
    setModalData(data);
    setModalInput(new Array(data.questions?.length || 1).fill(''));
    return new Promise((resolve) => {
      inputResolver.current = resolve;
    });
  };

  const submitModal = () => {
    if (inputResolver.current) {
      inputResolver.current(modalInput);
      setModalType(null);
      setModalData(null);
      inputResolver.current = null;
    }
  };

  const startAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setLogs(['Initiating engines...']);
    
    try {
      const data = await runDeepValidation(
        idea,
        founderDNA,
        handleValidationEvent,
        waitForInput
      );
      setResult(data);
      setPhase(10); // Finished
    } catch (err) {
      console.error(err);
      addLog('Error: Validation aborted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)] text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center animate-fade-in">
          <h1 className="text-6xl font-black mb-4 tracking-tighter">
            CO<span className="text-purple-500">VALIDATOR</span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded ml-2 uppercase tracking-widest align-middle">Deep Audit</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
            "The Silicon Valley Blitz-Auditor" — Full 8-phase high-pressure simulation.
          </p>
        </header>

        {!result && phase === -1 && (
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
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all"
                  placeholder="What pain point are you solving?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Solution</label>
                <textarea 
                  value={idea.solution}
                  onChange={(e) => setIdea({...idea, solution: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all"
                  placeholder="How does your tech fix it?"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full btn-premium"
              >
                START DEEP VALIDATION
              </button>
            </form>
          </div>
        )}

        {/* Loading / Progress State */}
        {loading && !modalType && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-20 animate-fade-in">
            <div className="relative inline-block">
              <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">
                {Math.round((phase / 8) * 100)}%
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Phase {Math.floor(phase)}: {phaseName}</h3>
              <p className="text-gray-400 italic">Engaging AI pattern matching and real-time market research...</p>
            </div>
            <div className="glass-card text-left bg-black text-xs font-mono p-4 opacity-70">
              {logs.map((log, i) => <div key={i} className="mb-1">{`> ${log}`}</div>)}
            </div>
          </div>
        )}

        {/* Interactive Modal */}
        {modalType && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
            <div className="max-w-3xl w-full glass-card border-purple-500 animate-fade-in">
              <div className="mb-8">
                <span className="text-xs font-black tracking-widest text-purple-400 uppercase">Input Required</span>
                <h2 className="text-3xl font-black mt-2">
                  {modalType === 'interrogation' ? 'The Interrogation' : 'The Angel of Death (Pre-Mortem)'}
                </h2>
                <p className="text-gray-400 italic mt-2">
                  {modalType === 'interrogation' 
                    ? "The blitz-auditor has flagged these concerns. Defend your idea."
                    : "The auditor has simulated your failure. How do you respond?"}
                </p>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {(modalData.questions || modalData.scenarios || []).map((q: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <div className="p-4 bg-purple-900/10 border-l-4 border-purple-500 rounded-r-lg">
                      <p className="font-bold text-lg">{q.question || q.scenario}</p>
                      {q.conflictNugget && <p className="text-sm text-red-400 mt-2 italic">{q.conflictNugget}</p>}
                    </div>
                    <textarea 
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-4 focus:border-purple-500 outline-none transition-all h-24"
                      placeholder="Type your response..."
                      value={modalInput[i]}
                      onChange={(e) => {
                        const newIn = [...modalInput];
                        newIn[i] = e.target.value;
                        setModalInput(newIn);
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={submitModal} className="btn-premium px-12">SUBMIT DEFENSE</button>
              </div>
            </div>
          </div>
        )}

        {/* Final Result Display */}
        {result && (
          <div className="space-y-12 animate-fade-in">
            {/* Verdict Header */}
            <div className="glass-card !bg-purple-900/10 border-purple-500/50 p-10 text-center">
               <div className="flex justify-center gap-4 mb-6">
                  {['overallWinnability', 'technicalFeasibility', 'marketOpportunity'].map((key) => (
                    <div key={key} className="px-6 py-2 glass rounded-full">
                       <span className="text-[10px] uppercase text-gray-500 block mr-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                       <span className="text-xl font-black">{result.compositeScores[key]}%</span>
                    </div>
                  ))}
               </div>
               <h3 className="text-5xl font-black mb-6 italic leading-tight max-w-4xl mx-auto">"{result.brutalTruth}"</h3>
               <div className="flex justify-center">
                  <span className={`px-6 py-2 rounded-full font-black tracking-widest uppercase border ${
                    result.verdict === 'highly_promising' ? 'border-green-500/50 text-green-400 bg-green-500/10' :
                    result.verdict === 'kill' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
                  }`}>
                    {result.verdictLabel || result.verdict}
                  </span>
               </div>
            </div>

            {/* 2-Column Grid for Logic Phases */}
            <div className="grid lg:grid-cols-2 gap-8">
               {/* 14-Dimension Scoreboard */}
               <section className="glass-card">
                 <h4 className="text-2xl font-black mb-8 border-b border-white/10 pb-4 text-purple-400">Dimension Scores</h4>
                 <div className="space-y-8">
                    {Object.entries(result.scores).map(([category, subs]: [string, any]) => (
                      <div key={category}>
                        <h5 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">{category}</h5>
                        <div className="grid grid-cols-1 gap-4">
                           {Object.entries(subs).map(([name, data]: [string, any]) => (
                             <div key={name} className="group">
                               <div className="flex justify-between items-center mb-1">
                                 <span className="text-sm font-bold text-gray-300">{name.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                                 <span className={`font-black ${data.score > 7 ? 'text-green-400' : data.score > 4 ? 'text-yellow-400' : 'text-red-400'}`}>{data.score}/10</span>
                               </div>
                               <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                                 <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${data.score * 10}%` }} />
                               </div>
                               <p className="text-xs text-gray-500 italic opacity-0 group-hover:opacity-100 transition-opacity">{data.signal}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    ))}
                 </div>
               </section>

               {/* Qualitative Analysis */}
               <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card">
                      <h4 className="text-xs font-bold text-purple-400 uppercase mb-4">Billion Dollar Path</h4>
                      <p className="text-sm text-gray-300 leading-relaxed italic">{result.futureSandbox.billionDollarPath}</p>
                    </div>
                    <div className="glass-card">
                      <h4 className="text-xs font-bold text-red-400 uppercase mb-4">The Zombie Path</h4>
                      <p className="text-sm text-gray-300 leading-relaxed italic">{result.futureSandbox.zombiePath}</p>
                    </div>
                  </div>

                  <div className="glass-card bg-black/30">
                     <h4 className="text-xs font-bold text-gray-400 uppercase mb-6">Unit Economics Reality</h4>
                     <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-white/5">
                          <div className="text-gray-500 text-[10px] uppercase mb-1">LTV</div>
                          <div className="text-xl font-black text-green-400">{result.unitEconomicsReality.ltv}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5">
                          <div className="text-gray-500 text-[10px] uppercase mb-1">CAC</div>
                          <div className="text-xl font-black text-red-400">{result.unitEconomicsReality.cac}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5">
                          <div className="text-gray-500 text-[10px] uppercase mb-1">Payback</div>
                          <div className="text-xl font-black">{result.unitEconomicsReality.payback}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5">
                          <div className="text-gray-500 text-[10px] uppercase mb-1">Margin</div>
                          <div className="text-xl font-black">{result.unitEconomicsReality.margin}</div>
                        </div>
                     </div>
                  </div>

                  <div className="glass-card border-l-4 border-yellow-500">
                     <h4 className="text-xs font-bold text-yellow-500 uppercase mb-4">Critical Risks</h4>
                     <ul className="space-y-2">
                        {result.majorRisks?.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-yellow-500">⚠</span> {r}
                          </li>
                        ))}
                     </ul>
                  </div>

                  <button onClick={() => {setResult(null); setPhase(-1);}} className="w-full py-4 border border-white/10 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all uppercase text-xs font-black tracking-widest">
                    Auditor Reset
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
