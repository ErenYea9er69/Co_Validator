import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput, AuditResult } from './SprintPlan';

interface InvestorMatchProps {
  idea: IdeaInput;
  auditResult: AuditResult;
  rawData: any;
}

interface Archetype {
  archetype: string;
  whatTheyCareAbout: string;
  exampleFirms: string[];
  fitScore: number;
  coldEmailTemplate: string;
}

interface BrutalQuestion {
  question: string;
  recommendedFramework: string;
}

interface InvestorMatchData {
  investorArchetypes: Archetype[];
  brutalQuestions: BrutalQuestion[];
}

export default function InvestorMatch({ idea, auditResult, rawData }: InvestorMatchProps) {
  const [matchData, setMatchData] = useState<InvestorMatchData | null>(null);
  const [loading, setLoading] = useState(false);

  // Practice Mode State
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [grades, setGrades] = useState<Record<number, { score: number, critique: string, betterExample: string } | null>>({});
  const [grading, setGrading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-investor-match');
    if (saved) {
      try {
        setMatchData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (matchData) {
      localStorage.setItem('co-validator-investor-match', JSON.stringify(matchData));
    }
  }, [matchData]);

  const generateMatch = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const res = await actions.matchInvestors(idea, auditResult, rawData, token);
      if (res.result && res.result.investorArchetypes) {
        setMatchData(res.result);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate investor matches.");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeAnswer = async (index: number) => {
    if (!matchData) return;
    const answer = answers[index];
    if (!answer?.trim()) return;

    setGrading({ ...grading, [index]: true });
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const question = matchData.brutalQuestions[index].question;
      const res = await actions.gradeFounderAnswer(question, answer, token);
      
      if (res.result) {
        setGrades(prev => ({ ...prev, [index]: res.result }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to grade answer.");
    } finally {
      setGrading({ ...grading, [index]: false });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  if (!matchData && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <div className="text-4xl text-green-500">💸</div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Investor Match & Pitch Prep</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Not all money is good money. We analyze your audit to find the exact investor archetypes that match your risk profile, Draft personalized cold emails, and pressure-test you with brutal questions you WILL face.
        </p>
        <button
          onClick={generateMatch}
          className="px-8 py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-green-500 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]"
        >
          Generate Match Report
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-bold animate-pulse text-sm">Matching profiles with active VC funds...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 space-y-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Fundraising Strategy</h2>
          <p className="text-gray-400 text-sm">Targeted archetypes and brutal practice questions tailored to {idea.name}.</p>
        </div>
        <button onClick={() => { localStorage.removeItem('co-validator-investor-match'); window.location.reload(); }} className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-black mt-4 md:mt-0 bg-white/5 px-4 py-2 rounded-lg">
          Clear Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Archetypes & Emails */}
        <div className="space-y-8">
          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-green-500">🎯</span> Target Profiles
          </h3>
          
          <div className="space-y-6">
            {matchData?.investorArchetypes.map((arch, i) => (
              <div key={i} className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 hover:border-green-500/30 transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 md:p-8">
                  <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 border-green-500/20 group-hover:border-green-500 transition-colors">
                    <span className="text-xs font-black text-white">{arch.fitScore}</span>
                    <span className="text-[8px] uppercase tracking-widest text-green-500/80">Fit</span>
                  </div>
                </div>

                <div className="pr-20">
                  <h4 className="text-2xl font-black text-white leading-tight mb-2">{arch.archetype}</h4>
                  <p className="text-sm text-gray-400 font-bold">{arch.whatTheyCareAbout}</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-2">Example Firms</span>
                  <div className="flex flex-wrap gap-2">
                    {arch.exampleFirms.map((firm, j) => (
                      <span key={j} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-white shadow-sm border border-white/5">{firm}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6 relative group/email">
                  <span className="text-[10px] uppercase font-black text-green-500 tracking-widest block mb-3">Sniper Cold Email</span>
                  <p className="text-sm text-green-100 font-serif whitespace-pre-wrap leading-relaxed">
                    {arch.coldEmailTemplate}
                  </p>
                  <button 
                    onClick={() => handleCopy(arch.coldEmailTemplate)}
                    className="absolute top-4 right-4 opacity-0 group-hover/email:opacity-100 transition-opacity bg-green-500/20 hover:bg-green-500 border border-green-500 text-green-400 hover:text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Pitch Mode */}
        <div className="space-y-8">
          <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
            <span className="text-red-500">🥊</span> Practice Pitch Mode
          </h3>
          <p className="text-sm text-gray-400 -mt-4">Type your answer to these brutal questions and get AI graded. Don't use fluff.</p>

          <div className="space-y-6">
            {matchData?.brutalQuestions.map((q, i) => (
              <div key={i} className={`bg-black/60 border rounded-3xl p-6 md:p-8 space-y-6 transition-all ${grades[i] ? (grades[i]!.score >= 8 ? 'border-green-500/50' : grades[i]!.score <= 5 ? 'border-red-500/50' : 'border-yellow-500/50') : 'border-white/10'}`}>
                
                <div className="flex gap-4 items-start">
                  <span className="text-lg md:text-2xl shrink-0">🤔</span>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2 leading-tight">"{q.question}"</h4>
                  </div>
                </div>

                {/* Founder Answer Input */}
                <div className="space-y-3 relative">
                  <textarea 
                    value={answers[i] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                    placeholder="Type exactly what you would say in the meeting..."
                    disabled={grading[i]}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-white/30 outline-none h-24 resize-none transition-colors"
                  />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 cursor-help" title={q.recommendedFramework}>
                      Hover for Hint
                    </span>
                    <button 
                      onClick={() => handleGradeAnswer(i)}
                      disabled={grading[i] || !answers[i]?.trim()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-lg transition-all"
                    >
                      {grading[i] ? 'Grading...' : 'Grade Answer'}
                    </button>
                  </div>
                </div>

                {/* Grade Result */}
                {grades[i] && (
                  <div className="mt-4 pt-6 border-t border-white/10 space-y-4 animate-slide-up">
                    <div className="flex items-center gap-4 mb-2">
                       <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-black text-lg ${
                         grades[i]!.score >= 8 ? 'border-green-500 text-green-500' : 
                         grades[i]!.score <= 5 ? 'border-red-500 text-red-500' : 'border-yellow-500 text-yellow-500'
                       }`}>
                         {grades[i]!.score}
                       </div>
                       <div className="flex-1">
                          <span className="text-[10px] uppercase tracking-widest font-black text-gray-500 block mb-1">Critique</span>
                          <p className="text-sm font-bold text-white leading-relaxed">{grades[i]!.critique}</p>
                       </div>
                    </div>
                    <div className="bg-blue-500/10 border-l-2 border-blue-500 p-4 rounded-r-lg">
                       <span className="text-[10px] uppercase tracking-widest font-black text-blue-400 block mb-1">Better Example</span>
                       <p className="text-sm font-serif text-blue-100 italic">"{grades[i]!.betterExample}"</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
