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
  bulletPoints: string[];
  speakerNotes: string;
}

interface PitchDeckData {
  slides: Slide[];
}

export default function PitchDeck({ idea, auditResult, rawData }: PitchDeckProps) {
  const [deck, setDeck] = useState<PitchDeckData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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
      alert("Failed to generate pitch deck.");
    } finally {
      setLoading(false);
    }
  };

  const updateSlide = (field: keyof Slide, value: any) => {
    if (!deck) return;
    setDeck(prev => {
      if (!prev) return null;
      const nextSlides = [...prev.slides];
      nextSlides[currentSlide] = { ...nextSlides[currentSlide], [field]: value };
      return { ...prev, slides: nextSlides };
    });
  };

  const copyAsMarkdown = () => {
    if (!deck) return;
    const md = deck.slides.map(s => `# Slide ${s.slideNumber}: ${s.title}\n## ${s.subtitle}\n\n${s.bulletPoints.map(p => `- ${p}`).join('\n')}\n\n> Speaker Notes: ${s.speakerNotes}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(md);
    alert("Copied to clipboard as Markdown!");
  };

  if (!deck && !loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 animate-fade-in p-12 bg-black/40 border border-white/10 rounded-3xl">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Pitch Deck Architect</h2>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Convert your raw idea and the audit's expert findings into a tailored 10-slide pitch deck structure using real market data and financial projections.
        </p>
        <button
          onClick={generateDeck}
          className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all shadow-lg"
        >
          Generate High-Stakes Deck
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-20 animate-fade-in">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
        <p className="text-white font-bold animate-pulse text-sm">Architecting slides from expert data...</p>
      </div>
    );
  }

  if (!deck) return null;

  const slide = deck.slides[currentSlide];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 print:p-0">
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl print:hidden">
        <span className="text-xs uppercase font-black text-gray-500 tracking-widest">
          Slide {currentSlide + 1} of {deck.slides.length}
        </span>
        <div className="flex gap-4">
          <button 
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-black/50 hover:bg-black text-white text-xs font-bold uppercase rounded-lg disabled:opacity-30 transition-all"
          >
            Previous
          </button>
          <button 
            onClick={() => setCurrentSlide(prev => Math.min(deck.slides.length - 1, prev + 1))}
            disabled={currentSlide === deck.slides.length - 1}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase rounded-lg disabled:opacity-30 transition-all"
          >
            Next
          </button>
        </div>
      </div>

      {/* Main Slide Card */}
      <div className="bg-black border border-white/20 rounded-2xl p-12 aspect-video flex flex-col justify-center relative shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none transition-transform group-hover:scale-110 duration-1000" />
        
        <div className="relative z-10 space-y-8">
          <div>
            <span className="text-[10px] text-gray-500 font-bold tracking-[0.2em] uppercase block mb-4">
              {slide.slideNumber}. {slide.title}
            </span>
            <h2 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateSlide('subtitle', e.currentTarget.innerText)}
              className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-tight max-w-2xl outline-none focus:bg-white/5 rounded transition-colors"
            >
              {slide.subtitle}
            </h2>
          </div>
          
          <ul className="space-y-4 max-w-xl">
            {slide.bulletPoints.map((bp, i) => (
              <li key={i} className="flex gap-4 text-gray-300 text-lg sm:text-lg items-start">
                <span className="text-white/30 font-black">—</span>
                <span 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const newBP = [...slide.bulletPoints];
                    newBP[i] = e.currentTarget.innerText;
                    updateSlide('bulletPoints', newBP);
                  }}
                  className="outline-none focus:bg-white/5 rounded transition-colors block w-full"
                >
                  {bp}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Speaker Notes */}
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-xl group relative">
        <span className="text-[10px] uppercase font-black text-blue-400 tracking-widest block mb-2">Speaker Notes</span>
        <p 
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateSlide('speakerNotes', e.currentTarget.innerText)}
          className="text-sm text-blue-100/70 leading-relaxed italic outline-none focus:bg-white/5 rounded p-2"
        >
          "{slide.speakerNotes}"
        </p>
      </div>

      {/* Thumbnail Nav */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar print:hidden">
        {deck.slides.map((s, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`min-w-[120px] aspect-video border rounded-lg p-2 text-left flex flex-col justify-end transition-all ${
              currentSlide === i ? 'border-white bg-white/10' : 'border-white/10 bg-black/40 hover:border-white/30'
            }`}
          >
            <span className={`text-[8px] font-black uppercase ${currentSlide === i ? 'text-white' : 'text-gray-500'}`}>
              Slide {s.slideNumber}
            </span>
            <span className={`text-[10px] font-bold truncate block ${currentSlide === i ? 'text-white' : 'text-gray-400'}`}>
              {s.title}
            </span>
          </button>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap justify-between items-center pt-8 gap-4 print:hidden">
        <div className="flex gap-4">
          <button 
            onClick={copyAsMarkdown}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
          >
            Copy Markdown
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
          >
            PDF / Print
          </button>
        </div>
        
        <button 
          onClick={() => {
            if (confirm("Regenerate deck? All manual edits will be lost.")) {
              setDeck(null);
            }
          }}
          className="text-[10px] text-gray-600 uppercase tracking-widest font-bold hover:text-red-500 transition-colors"
        >
          Regenerate Deck
        </button>
      </div>
    </div>
  );
}
