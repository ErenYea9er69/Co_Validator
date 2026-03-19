import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface InvestorMatchProps {
  idea: IdeaInput;
  auditResult: any;
  rawData: any;
}

interface Archetype {
  archetype: string;
  whatTheyCareAbout: string;
  exampleFirms: string[];
  fitScore: number;
  coldEmailTemplate?: string;
}

interface MatchQuestion {
  question: string;
  answerFramework: string;
}

interface MatchData {
  investorArchetypes: Archetype[];
  brutalQuestions: MatchQuestion[];
}

export default function InvestorMatch({ idea, auditResult, rawData }: InvestorMatchProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmailIndex, setShowEmailIndex] = useState<number | null>(null);

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
      if (res.result) {
        setMatchData(res.result);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate investor match.");
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Email template copied!");
  };

  if (!matchData && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <h2 className="text-3xl font-black text-green-500 uppercase tracking-tighter">Investor Match</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Find the exact archetypes of angels and VCs who fund this specific type of risk and get tailored outreach templates.
        </p>
        <button
          onClick={generateMatch}
          className="px-8 py-4 bg-green-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
        >
          Find My Investors
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-green-400 font-bold animate-pulse text-sm">Matching profiles to capital allocators...</p>
      </div>
    );
  }

  if (!matchData) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Capital Match</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          These archetypes fund your specific risk profile. Use the templates below for outreach.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {matchData.investorArchetypes.map((arch, i) => (
          <div key={i} className="bg-black/40 border border-white/10 rounded-2xl flex flex-col group hover:border-green-500/50 transition-all">
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-black text-green-400 tracking-widest block">Archetype</span>
                <span className="text-[10px] uppercase font-black text-gray-400 bg-white/5 px-2 py-1 rounded">Fit: {arch.fitScore}%</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight mb-4">{arch.archetype}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 italic">"{arch.whatTheyCareAbout}"</p>
              
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl mb-6">
                <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-2">Example Target List</span>
                <ul className="space-y-1">
                  {arch.exampleFirms.map((firm, idx) => (
                    <li key={idx} className="text-xs text-white font-bold tracking-wide">— {firm}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10">
              <button 
                onClick={() => setShowEmailIndex(showEmailIndex === i ? null : i)}
                className="w-full py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 font-black text-[10px] uppercase tracking-widest rounded-lg border border-green-500/20 transition-all"
              >
                {showEmailIndex === i ? 'Hide Template' : 'Show Cold Email'}
              </button>
              
              {showEmailIndex === i && arch.coldEmailTemplate && (
                <div className="mt-4 p-4 bg-black/80 border border-white/10 rounded-xl space-y-4 animate-slide-up">
                  <div className="text-[10px] text-gray-500 uppercase font-black">Email Template</div>
                  <p className="text-xs text-blue-100/70 whitespace-pre-wrap leading-relaxed">{arch.coldEmailTemplate}</p>
                  <button 
                    onClick={() => copyEmail(arch.coldEmailTemplate!)}
                    className="w-full py-2 bg-white text-black font-black text-[10px] uppercase rounded-lg"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-red-500/10 border border-red-500/30 rounded-3xl p-8 lg:p-12 relative overflow-hidden shadow-2xl shadow-red-500/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 space-y-10">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-red-400 block mb-4">Boardroom Readiness</span>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
              Survival Guide: The Brutal Meeting
            </h3>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {(matchData.brutalQuestions || []).map((q, i) => (
              <div key={i} className="space-y-4 p-6 bg-black/50 border border-red-500/20 rounded-2xl group hover:border-red-500/40 transition-all">
                <div className="flex gap-4">
                  <span className="text-red-500 font-black text-2xl">0{i + 1}</span>
                  <h4 className="text-lg text-white font-bold leading-tight">{q.question}</h4>
                </div>
                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                  <span className="text-[9px] uppercase font-black text-red-400 tracking-widest block mb-2">How to Answer</span>
                  <p className="text-sm text-red-200/60 leading-relaxed italic">{q.answerFramework}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <button 
          onClick={() => { if (confirm("Regenerate matches?")) setMatchData(null); }}
          className="text-[10px] text-gray-600 uppercase tracking-widest font-bold hover:text-red-500 transition-colors"
        >
          Regenerate Matches
        </button>
      </div>
    </div>
  );
}
