import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface InvestorMatchProps {
  idea: IdeaInput;
  auditResult: any;
}

interface Archetype {
  archetype: string;
  whatTheyCareAbout: string;
  exampleFirms: string[];
  fitScore: number;
}

interface MatchData {
  investorArchetypes: Archetype[];
  brutalQuestionsTheyWillAsk: string[];
}

export default function InvestorMatch({ idea, auditResult }: InvestorMatchProps) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);

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
      const res = await actions.matchInvestors(idea, auditResult, token);
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

  if (!matchData && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <h2 className="text-3xl font-black text-green-500 uppercase tracking-tighter">Investor Match</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Not all money is the same. Find the exact archetypes of angels and VCs who fund this specific type of risk.
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
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Capital Match</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          These are the archetypes of investors who typically fund your specific risk profile.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {matchData.investorArchetypes.map((arch, i) => (
          <div key={i} className="bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-green-500/50 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-black text-green-400 tracking-widest block">Archetype</span>
                <span className="text-[10px] uppercase font-black text-gray-400 bg-white/5 px-2 py-1 rounded">Fit: {arch.fitScore}/100</span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight mb-4">{arch.archetype}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">"{arch.whatTheyCareAbout}"</p>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-2">Example Firms</span>
              <ul className="space-y-1">
                {arch.exampleFirms.map((firm, idx) => (
                  <li key={idx} className="text-xs text-white font-bold tracking-wide">— {firm}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-red-500/10 border border-red-500/30 rounded-3xl p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-red-400 block mb-4">Red Team Preparation</span>
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">
            The Brutal Questions They Will Ask You To Destroy Your Pitch
          </h3>
          <ul className="space-y-4">
            {matchData.brutalQuestionsTheyWillAsk.map((q, i) => (
              <li key={i} className="flex gap-4 p-4 bg-black/50 border border-red-500/20 rounded-xl">
                <span className="text-red-500 font-black">0{i + 1}</span>
                <span className="text-red-100 font-bold text-sm lg:text-base">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <button 
          onClick={() => {
            if (confirm("Are you sure you want to regenerate investor matches?")) {
              setMatchData(null);
            }
          }}
          className="text-[10px] text-gray-600 uppercase tracking-widest font-bold hover:text-red-500 transition-colors"
        >
          Regenerate Matches
        </button>
      </div>
    </div>
  );
}
