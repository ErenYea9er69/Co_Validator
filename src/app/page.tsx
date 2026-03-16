'use client';

import { useState } from 'react';
import { validateIdea, StartupIdea } from '@/lib/validator';

export default function Home() {
  const [idea, setIdea] = useState<StartupIdea>({
    name: '',
    problem: '',
    solution: '',
    competitors: '',
    monetization: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await validateIdea(idea, null);
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Validation failed. Check your API keys and console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center animate-fade-in">
          <h1 className="text-6xl font-black mb-4 tracking-tighter">
            CO<span className="text-purple-500">VALIDATOR</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto italic">
            "The Silicon Valley Blitz-Auditor" — High-pressure, pattern-matching audit of your startup idea.
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Input Form */}
          <section className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Auditor Input</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <label className="block text-sm font-medium text-gray-400 mb-2">The Problem</label>
                <textarea 
                  value={idea.problem}
                  onChange={(e) => setIdea({...idea, problem: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all"
                  placeholder="What pain point are you solving?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">The Solution</label>
                <textarea 
                  value={idea.solution}
                  onChange={(e) => setIdea({...idea, solution: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all"
                  placeholder="How does your tech fix it?"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full btn-premium flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Auditing...
                  </>
                ) : 'INITIATE BLITZ-AUDIT'}
              </button>
            </form>
          </section>

          {/* Results Sidebar/Placeholder */}
          <section className="space-y-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {!result ? (
              <div className="glass-card h-full flex flex-col items-center justify-center text-center p-12 border-dashed">
                <div className="text-4xl mb-4 opacity-20">⚡</div>
                <h3 className="text-xl font-bold text-gray-500">Awaiting Data</h3>
                <p className="text-gray-600">The auditor needs your idea details to begin the dimension matching.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="glass-card !bg-purple-900/10 border-purple-500/50">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black tracking-widest text-purple-400 uppercase">Audit Verdict</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      result.verdict === 'highly_promising' ? 'bg-green-500/20 text-green-400' :
                      result.verdict === 'kill' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {result.verdictLabel}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black mb-4 italic leading-tight">"{result.brutalTruth}"</h3>
                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{result.compositeScores.overallWinnability}%</div>
                      <div className="text-[10px] uppercase text-gray-500">Winnability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{result.compositeScores.technicalFeasibility}%</div>
                      <div className="text-[10px] uppercase text-gray-500">Feasibility</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">{result.compositeScores.marketOpportunity}%</div>
                      <div className="text-[10px] uppercase text-gray-500">Market Op</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Billion Dollar Path</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.futureSandbox.billionDollarPath}</p>
                  </div>
                  <div className="glass-card">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">The Zombie Path</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.futureSandbox.zombiePath}</p>
                  </div>
                </div>

                <div className="glass-card">
                   <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Unit Economics Reality</h4>
                   <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase">LTV</div>
                        <div className="font-bold text-green-400">{result.unitEconomicsReality.ltv}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase">CAC</div>
                        <div className="font-bold text-red-400">{result.unitEconomicsReality.cac}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase">Payback</div>
                        <div className="font-bold">{result.unitEconomicsReality.payback}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-[10px] uppercase">Margin</div>
                        <div className="font-bold">{result.unitEconomicsReality.margin}</div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
