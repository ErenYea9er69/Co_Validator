import React, { useState, useEffect } from 'react';
import * as actions from '../actions';
import { IdeaInput } from './SprintPlan';

interface PitchDeckProps {
  idea: IdeaInput;
  auditResult: any;
  rawData: any;
}

interface Slide {
  slideNumber: number;
  title: string;
  subtitle: string;
  slideLayout?: 'text' | 'chart' | 'comparison';
  bulletPoints: string[];
  objectionHotspot?: string;
  speakerNotes: string;
}

interface PitchDeckData {
  slides: Slide[];
}

export default function PitchDeck({ idea, auditResult, rawData }: PitchDeckProps) {
  const [deck, setDeck] = useState<PitchDeckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Rewrite State
  const [rewriting, setRewriting] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [showRewriteModal, setShowRewriteModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('co-validator-pitch-deck');
    if (saved) {
      try {
        setDeck(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (deck) {
      localStorage.setItem('co-validator-pitch-deck', JSON.stringify(deck));
    }
  }, [deck]);

  const generateDeck = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const res = await actions.createPitchDeck(idea, auditResult, rawData, token);
      if (res.result && res.result.slides) {
        setDeck(res.result);
        setCurrentSlide(0);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate deck.");
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!deck || !rewritePrompt.trim()) return;
    setRewriting(true);
    try {
      const token = localStorage.getItem('AUDIT_SECRET') || undefined;
      const slideToFix = deck.slides[currentSlide];
      const context = `Idea: ${idea.name}. Industry: ${idea.industry || 'Tech'}. Audience: ${idea.targetAudience}`;
      
      const res = await actions.rewriteSingleSlide(context, slideToFix, rewritePrompt, token);
      
      if (res.result && res.result.updatedSlide) {
        const newDeck = { ...deck };
        newDeck.slides[currentSlide] = res.result.updatedSlide;
        setDeck(newDeck);
        setShowRewriteModal(false);
        setRewritePrompt('');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to rewrite slide.");
    } finally {
      setRewriting(false);
    }
  };

  if (!deck && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <div className="text-4xl">🎤</div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">The 10-Slide Deck</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Generate a tier-1 VC pitch deck perfectly structured around your audit data. It automatically embeds your market size, competitor threats, and financial viability numbers.
        </p>
        <button
          onClick={generateDeck}
          className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          Draft Initial Deck
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-bold animate-pulse text-sm">Architecting slides using your data metrics...</p>
      </div>
    );
  }

  const slide = deck?.slides[currentSlide];

  const renderSlideContent = () => {
    if (!slide) return null;

    const layout = slide.slideLayout || 'text';

    if (layout === 'chart') {
      return (
        <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center p-8 bg-black/40 border border-white/10 rounded-2xl">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-8 border-blue-500 border-r-transparent border-b-transparent rotate-45 flex items-center justify-center">
            <span className="text-4xl font-black -rotate-45 text-white">X%</span>
          </div>
          <div className="space-y-4 flex-1">
            {slide.bulletPoints.map((bp, i) => (
              <div key={i} className="flex gap-4 items-start">
                <span className="text-blue-500 font-black mt-1">✓</span>
                <p className="text-lg md:text-xl text-gray-200 font-bold">{bp}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (layout === 'comparison') {
      return (
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-red-400 mb-4 block">Them</span>
            <ul className="space-y-3">
              {slide.bulletPoints.slice(0, Math.ceil(slide.bulletPoints.length/2)).map((bp, i) => (
                <li key={i} className="text-gray-300 text-sm md:text-base border-b border-red-500/10 pb-2">❌ {bp}</li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col justify-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 mb-4 block">Us</span>
            <ul className="space-y-3">
               {slide.bulletPoints.slice(Math.ceil(slide.bulletPoints.length/2)).map((bp, i) => (
                <li key={i} className="text-white font-bold text-sm md:text-base border-b border-blue-500/10 pb-2">✅ {bp}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    // Default 'text' layout
    return (
      <div className="flex-1 flex flex-col justify-center py-8 max-w-2xl">
        <ul className="space-y-6">
          {slide.bulletPoints.map((bp, i) => (
            <li key={i} className="flex gap-4 items-start text-xl md:text-3xl text-gray-200 font-bold leading-tight">
              <span className="text-blue-500 shrink-0">→</span>
              <span>{bp}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-20">
      <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-gray-500 border-b border-white/10 pb-4">
         <span>Slide {currentSlide + 1} of {deck?.slides.length}</span>
         <button onClick={() => { localStorage.removeItem('co-validator-pitch-deck'); window.location.reload(); }} className="hover:text-white">Start Over</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Slide Display Server */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-[16/9] w-full bg-[#111] border border-white/20 rounded-3xl p-8 md:p-12 flex flex-col shadow-2xl relative overflow-hidden group">
            {/* Slide Header */}
            <div className="mb-8 relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2">{slide?.title}</h2>
              <p className="text-lg md:text-2xl text-blue-400 font-bold">{slide?.subtitle}</p>
            </div>

            {/* Layout Specific Content */}
            {renderSlideContent()}

            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
          </div>

          <div className="flex justify-between items-center">
            <button 
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              ←
            </button>
            
            <button 
              onClick={() => setShowRewriteModal(true)}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-blue-500"
            >
              🔄 AI Rewrite This Slide
            </button>

            <button 
              onClick={() => setCurrentSlide(Math.min((deck?.slides.length || 1) - 1, currentSlide + 1))}
              disabled={deck !== null ? currentSlide === deck.slides.length - 1 : false}
              className="p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              →
            </button>
          </div>
        </div>

        {/* Presenter Notes & Hotspots Column */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
             
             {/* Objection Hotspot */}
             {slide?.objectionHotspot && (
               <div className="mb-6 bg-red-500/10 border-l-2 border-red-500 p-4 rounded-r-lg animate-slide-up">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-red-500">⚠️</span>
                   <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Investor Objection Hotspot</span>
                 </div>
                 <p className="text-xs text-red-200/80 font-bold leading-relaxed">
                   {slide.objectionHotspot}
                 </p>
               </div>
             )}

             <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-4">Speaker Notes</h4>
             <p className="text-sm text-gray-300 leading-relaxed font-serif">
               {slide?.speakerNotes}
             </p>
          </div>
        </div>

      </div>

      {/* Rewrite Modal */}
      {showRewriteModal && deck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] border border-white/20 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <button onClick={() => setShowRewriteModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white tracking-tight">AI Slide Rewrite</h3>
            <p className="text-xs text-gray-400">Tell the AI exactly what to change about this slide.</p>
            
            <textarea 
              autoFocus
              value={rewritePrompt}
              onChange={(e) => setRewritePrompt(e.target.value)}
              placeholder="e.g., 'Make it punchier, focus more on our enterprise tier rather than SMBs...'"
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors h-32 resize-none"
            />
            
            <button 
              onClick={handleRewrite}
              disabled={!rewritePrompt.trim() || rewriting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg transition-all flex justify-center items-center h-[52px]"
            >
              {rewriting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Apply Rewrite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
