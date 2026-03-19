'use client';

import { useState, useEffect } from 'react';
import * as actions from './actions';
import Roadmap from './components/Roadmap';
import CommandCenter, { TabId } from './components/CommandCenter';
import SprintPlan from './components/SprintPlan';
import AssumptionTracker from './components/AssumptionTracker';
import CompetitorWatch from './components/CompetitorWatch';
import Benchmarks from './components/Benchmarks';
import PitchDeck from './components/PitchDeck';
import InvestorMatch from './components/InvestorMatch';
import PivotSimulator from './components/PivotSimulator';
import { safeJsonParse } from '@/lib/safeJsonParse';


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
    name: '', problem: '', solution: '', industry: '', targetAudience: '', monetization: '', competitorsInfo: '', stage: 'idea',
    founderBackground: '', budget: '', locale: 'Global',
    whyNow: '', tractionEvidence: '', targetPricing: '', acquisitionChannel: '',
    coFounders: '', tractionDocs: '',
    interrogationAnswers: [] as { question: string; answer: string; targetMetric: string }[]
  });

  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [auditUsage, setAuditUsage] = useState({ tokens: 0, searches: 0 });
  const totalSteps = 24;
  const [phase, setPhase] = useState<number>(-1);
  const [phaseName, setPhaseName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dossier');
  const [challenges, setChallenges] = useState<any>(null);
  const [stressTestInput, setStressTestInput] = useState('');
  const [stressTestResult, setStressTestResult] = useState<any>(null);
  const [stressTestLoading, setStressTestLoading] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [rawData, setRawData] = useState<any>({});
  const [stressResults, setStressResults] = useState<any[]>([]);
  const [isStressTesting, setIsStressTesting] = useState(false);

  const [failedPhases, setFailedPhases] = useState<string[]>([]);

  // Phase 0: Interrogation States
  const [interrogationSuite, setInterrogationSuite] = useState<any>(null);
  const [interrogationActive, setInterrogationActive] = useState(false);
  const [interrogationAnswers, setInterrogationAnswers] = useState<Record<string, string>>({});
  const [specificityScore, setSpecificityScore] = useState<number>(0);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-12), msg]);

    const [auditToken, setAuditToken] = useState<string>(''); // Fix 8: Token state
    
    // ─── localStorage persistence ───
    const SCHEMA_VERSION = 4;

    useEffect(() => {
      try {
        const savedToken = localStorage.getItem('audit-token') || process.env.NEXT_PUBLIC_AUDIT_SECRET || '';
        setAuditToken(savedToken);

        const saved = localStorage.getItem('co-validator-audit');
        if (saved) {
          const { result: r, rawData: rd, challenges: ch, idea: id, version } = JSON.parse(saved);
          if (version === SCHEMA_VERSION && r) { 
            setResult(r); setRawData(rd || {}); setChallenges(ch || null); setIdea(id); setPhase(10); 
          } else {
            localStorage.removeItem('co-validator-audit');
          }
        }
      } catch {}
    }, []);

  const handleStressTest = async (change: string) => {
    if (!change || isStressTesting) return;
    setIsStressTesting(true);
    try {
      const summary = {
        assumptions: result.criticalAssumptionStack,
        reasoning: result.reasoning,
      };
      const testResult = await actions.runStressTest(JSON.stringify(idea), change, summary as any);
      setStressResults(prev => [{ ...testResult.result, change, id: Date.now() }, ...prev]); // Fix 3: Spread result
    } catch (e) {
      console.error(e);
    } finally {
      setIsStressTesting(false);
    }
  };


  useEffect(() => {
    if (result && phase === 10) {
      try {
        localStorage.setItem('co-validator-audit', JSON.stringify({ 
          result, rawData, challenges, idea, version: SCHEMA_VERSION 
        }));
      } catch {}
    }
  }, [result, rawData, challenges, idea, phase]);

  const clearSaved = () => { localStorage.removeItem('co-validator-audit'); };

  const renderSafe = (val: any): any => {
    if (!val) return "";
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (Array.isArray(val)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {val.map((v, i) => (
            <li key={i}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return (
        <div className="space-y-1">
          {Object.entries(val).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-bold text-gray-400 capitalize">{k}:</span>
              <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return String(val);
  };

  // ─── Phase 0: Input Interrogation ───
  const startInterrogation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setLogs(['Analyzing input specificity...']);
    setPhase(0); setPhaseName('Input Interrogation');

    try {
      const response = await actions.runInputInterrogation(idea);
      setInterrogationSuite(response.result);
      setSpecificityScore(response.result.specificityScore);
      
      if (response.result.readyForAudit) {
        addLog('Specificity threshold met. Proceeding to audit.');
        await performFullAudit();
      } else {
        addLog('Input too thin. Interrogation required.');
        setInterrogationActive(true);
      }
    } catch (err) {
      addLog('⚠️ Interrogation failed. Falling back to default audit.');
      await performFullAudit();
    }
    setLoading(false);
  };

  const handleInterrogationSubmit = async () => {
    setLoading(true);
    addLog('Refining idea with extracted data...');
    
    const newAnswers = Object.entries(interrogationAnswers).map(([qId, answer]) => {
      const question = interrogationSuite.interrogationSuite.find((q: any) => q.id === qId);
      return {
        question: question?.question || qId,
        answer,
        targetMetric: question?.targetMetric || 'General'
      };
    });

    const refinedIdea = { 
      ...idea, 
      interrogationAnswers: [...idea.interrogationAnswers, ...newAnswers] 
    };

    setIdea(refinedIdea);
    setInterrogationActive(false);
    await performFullAudit(refinedIdea);
  };

  // ─── Audit orchestrator with PARALLELIZED phases + error resilience ───
  const performFullAudit = async (customIdea?: any) => {
    const currentIdea = customIdea || idea;
    setLoading(true); setResult(null); setChallenges(null); setRawData({}); setActiveTab('dossier');
    setCompletedSteps(0);
    setAuditUsage({ tokens: 0, searches: 0 }); // Fix 6: Reset usage
    setStressTestResult(null); setFailedPhases([]); setLogs(['Initiating engines...']);

    const trackUsage = (res: any) => {
      if (!res) return;
      setAuditUsage(prev => ({
        tokens: prev.tokens + (res.usage?.total_tokens || 0),
        searches: prev.searches + (res.tavilyCredits || 0)
      }));
    };

    const evidence: Record<string, any[]> = {};
    let p1: any = null, p2: any = null, p3: any = null, p4: any = null, p5: any = null, p6: any = null, p7: any = null, p_fit: any = null;
    let interrogationData: any = null, preMortemData: any = null, syntheticData: any = null;
    let trendData: any = null, biasData: any = null;
    let factCheckData: any = null, consistencyData: any = null, unitEconData: any = null, graveyardData: any = null, secondOpinionData: any = null;
    const failed: string[] = [];

    // ═══ WAVE 0: Pre-Flight (Truth & Calibration) ═══
    setPhase(0.5); setPhaseName('Pre-Flight Calibration'); addLog('Running Trend Radar & Bias Detection...');
    const wave0 = await Promise.allSettled([
      actions.runTrendRadar(currentIdea.industry, auditToken),
      actions.runBiasCalibration(JSON.stringify(currentIdea), currentIdea.founderBackground, auditToken)
    ]);
    if (wave0[0].status === 'fulfilled') { trendData = wave0[0].value; setRawData((prev: any) => ({ ...prev, trendRadar: trendData })); addLog('Trend Radar ✓'); trackUsage(trendData); setCompletedSteps(prev => prev + 1); }
    if (wave0[1].status === 'fulfilled') { biasData = wave0[1].value; setRawData((prev: any) => ({ ...prev, founderBias: biasData })); addLog('Bias Calibration ✓'); trackUsage(biasData); setCompletedSteps(prev => prev + 1); }

    // ═══ WAVE 1: Independent phases in parallel (1, 2, 4, 5, Fit, Synthetic) ═══
    setPhase(1); setPhaseName('Parallel Scan (6 phases)'); addLog('Launching parallel research wave...');
    
    // Fix 8: Ensure interrogation answers are prominent in the prompt context
    const interrogationVerified = (currentIdea.interrogationAnswers?.length > 0 
      ? `\nVERIFIED REFINEMENTS FROM INTERROGATION:\n${currentIdea.interrogationAnswers.map((a: any) => `- Q: ${a.question}\n  A: ${a.answer}`).join('\n')}`
      : "") + (trendData?.result ? `\nCURRENT 90-DAY TRENDS:\n${JSON.stringify(trendData.result)}` : "");
    const baseContext = `IDEA_INPUT: ${JSON.stringify(currentIdea)}${interrogationVerified}`;

    const wave1 = await Promise.allSettled([
      actions.runPhase1Problem(currentIdea, `Initial Scan${interrogationVerified}`, auditToken),
      actions.runPhase2Competitors(currentIdea, `${currentIdea.competitorsInfo}${interrogationVerified}`, auditToken),
      actions.runPhase4Feasibility(currentIdea, auditToken),
      actions.runPhase5Market(currentIdea, auditToken),
      actions.runFounderFit(currentIdea, auditToken),
      actions.runSyntheticResearch(currentIdea, auditToken),
    ]);

    wave1.forEach((w, i) => {
      const labels = ['Problem Reality', 'Competitor Investigation', 'Build Feasibility', 'Market & Monetization', 'Founder-Market Fit', 'Synthetic Primary Research'];
      if (w.status === 'fulfilled') {
        const res = w.value as any;
        trackUsage(res);
        setCompletedSteps(prev => prev + 1);
        
        if (res.result?._parseError) {
          failed.push(`${labels[i]} (Data Corrupted)`);
          addLog(`⚠️ ${labels[i]} corrupted`);
        }

        switch(i) {
          case 0: p1 = res; break;
          case 1: p2 = res; break;
          case 2: p4 = res; break;
          case 3: p5 = res; break;
          case 4: p_fit = res; break;
          case 5: syntheticData = res; break;
        }
      } else {
        failed.push(labels[i]);
        addLog(`⚠️ ${labels[i]} failed`);
      }
    });

    // Fix 13: Incremental save after Wave 1
    const w1Data = { p1, p2, p4, p5, p_fit, syntheticData };
    setRawData((prev: any) => {
        const updated = { ...prev, ...w1Data };
        localStorage.setItem('audit-in-progress', JSON.stringify({ idea: currentIdea, rawData: updated, phase: 1 }));
        return updated;
    });



    // ═══ CIRCUIT BREAKER: Abort if 3+ Wave 1 phases failed ═══
    if (failed.length >= 3) {
      addLog('❌ CIRCUIT BREAKER: Too many phase failures. Audit data would be unreliable.');
      setFailedPhases(failed);
      setLoading(false);
      setResult({ verdict: '⚠️', verdictLabel: 'AUDIT ABORTED — Insufficient Data', reasoning: `${failed.length} out of 5 initial phases failed. The audit cannot produce a reliable verdict. Please check your API keys and retry.`, compositeScores: {}, scores: {} });
      setPhase(10);
      return;
    }

    // ═══ WAVE 2: Phases dependent on P2 (3, 6, Regulatory, Financial) ═══
    setPhase(3); setPhaseName('Deep-Dive Wave'); addLog('Analyzing saturation, differentiation, regulatory, and financials...');
    const wave2 = await Promise.allSettled([
      actions.runPhase3Competition(currentIdea, p2?.raw || '', auditToken),
      actions.runPhase6Differentiation(currentIdea, p2?.raw || '', auditToken),
      actions.runPhase9Regulatory(currentIdea, JSON.stringify({ p1, p2, p4 }), auditToken),
      actions.runPhase10Financial(currentIdea, JSON.stringify({ p1, p2, p4, p5 }), auditToken),
    ]);

    let p9: any = null, p10: any = null;
    wave2.forEach((w, i) => {
      const labels = ['Saturation Risk', 'Differentiation', 'Regulatory Fortress', 'Financial Engine'];
      if (w.status === 'fulfilled') {
        const res = w.value as any;
        trackUsage(res);
        setCompletedSteps(prev => prev + 1);
        
        if (res.result?._parseError) {
          failed.push(`${labels[i]} (Data Corrupted)`);
          addLog(`⚠️ ${labels[i]} corrupted`);
        }

        switch(i) {
          case 0: p3 = res; break;
          case 1: p6 = res; break;
          case 2: p9 = res; break;
          case 3: p10 = res; break;
        }
      } else {
        failed.push(labels[i]);
        addLog(`⚠️ ${labels[i]} failed`);
      }
    });

    // Fix 13: Incremental save after Wave 2
    setRawData((prev: any) => {
        const updated = { ...prev, p3, p6, p9, p10 };
        localStorage.setItem('audit-in-progress', JSON.stringify({ idea: currentIdea, rawData: updated, phase: 3 }));
        return updated;
    });

    // ═══ WAVE 2.5: Truth Synthesis Middle-Layer ═══
    setPhase(4.5); setPhaseName('Intelligence Verification'); addLog('Fact-checking AI claims and finding contradictions...');
    const intermediateOutputs = JSON.stringify({ p1: p1?.result, p2: p2?.result, p3: p3?.result, p4: p4?.result, p5: p5?.result, p6: p6?.result, p9: p9?.result, p10: p10?.result, syntheticData: syntheticData?.result });
    
    const wave2_5 = await Promise.allSettled([
      actions.runFactCheck(JSON.stringify({ Phase2_Competitors: p2?.result, Phase5_Market: p5?.result }), auditToken),
      actions.runConsistencyAudit(intermediateOutputs, auditToken),
      actions.runUnitEconVerification(JSON.stringify(p10?.result || {}), currentIdea.industry, auditToken),
      actions.runGraveyardAnalysis(JSON.stringify(currentIdea), currentIdea.industry, auditToken)
    ]);
    
    if (wave2_5[0].status === 'fulfilled') { factCheckData = wave2_5[0].value; setRawData((prev: any) => ({ ...prev, factCheck: factCheckData })); trackUsage(factCheckData); setCompletedSteps(prev => prev + 1); }
    if (wave2_5[1].status === 'fulfilled') { consistencyData = wave2_5[1].value; setRawData((prev: any) => ({ ...prev, consistency: consistencyData })); trackUsage(consistencyData); setCompletedSteps(prev => prev + 1); }
    if (wave2_5[2].status === 'fulfilled') { unitEconData = wave2_5[2].value; setRawData((prev: any) => ({ ...prev, unitEcon: unitEconData })); trackUsage(unitEconData); setCompletedSteps(prev => prev + 1); }
    if (wave2_5[3].status === 'fulfilled') { graveyardData = wave2_5[3].value; setRawData((prev: any) => ({ ...prev, graveyard: graveyardData })); trackUsage(graveyardData); setCompletedSteps(prev => prev + 1); }
    addLog('Truth Verification complete ✓');

    // ═══ WAVE 3: Intelligence (Interrogation + Pre-Mortem + Debate + Competitive Response + Apathy) ═══
    const researchSummary = JSON.stringify({
      p1: p1?.result, p2: p2?.result, p3: p3?.result, p4: p4?.result, p5: p5?.result, p6: p6?.result, 
      p_fit: p_fit?.result, synthetic: syntheticData?.result,
      truthData: { factCheck: factCheckData?.result, consistency: consistencyData?.result, graveyard: graveyardData?.result }
    });

    setPhase(6.5); setPhaseName('Deep Intelligence'); addLog('Running simulations and adversarial debate...');
    const wave3 = await Promise.allSettled([
      actions.runInterrogation(currentIdea, researchSummary, auditToken),
      actions.runPreMortem(currentIdea, researchSummary, auditToken),
      actions.runDebateEngine(currentIdea, researchSummary, auditToken),
      actions.runCompetitiveResponse(currentIdea, researchSummary, auditToken),
      actions.runApathySimulation(currentIdea, researchSummary, auditToken),
    ]);

    wave3.forEach((w, i) => {
      if (w.status === 'fulfilled') {
        const res = w.value;
        trackUsage(res);
        setCompletedSteps(prev => prev + 1);
        
        switch(i) {
          case 0: interrogationData = res; addLog('Interrogation ready ✓'); break;
          case 1: 
            preMortemData = res; 
            setRawData((prev: any) => {
              const updated = { ...prev, preMortem: res };
              localStorage.setItem('audit-raw-data', JSON.stringify(updated)); // Fix 13: Incremental save
              return updated;
            }); // Fix 1: Properly persist preMortem
            addLog('Simulation complete ✓'); 
            break;
          case 2: setRawData((prev: any) => ({ ...prev, debate: res })); addLog('Adversarial debate complete ✓'); break;
          case 3: setRawData((prev: any) => ({ ...prev, competitiveResponse: res })); addLog('Competitive retaliation simulated ✓'); break;
          case 4: setRawData((prev: any) => ({ ...prev, apathy: res })); addLog('Customer apathy simulated ✓'); break;
        }
      } else {
        const labels = ['Interrogation', 'Pre-Mortem', 'Debate Engine', 'Competitive Response', 'Apathy Simulation'];
        failed.push(labels[i]);
        addLog(`⚠️ ${labels[i]} failed`);
      }
    });

    setChallenges({ interrogation: interrogationData, preMortem: preMortemData });

    // Fix 4: Rebuild summary with Wave 3 intelligence
    const fullResearchSummary = JSON.stringify({
      wave1: { p1: p1?.result, p2: p2?.result, p4: p4?.result, p5: p5?.result, p_fit: p_fit?.result, synthetic: syntheticData?.result },
      wave2: { p3: p3?.result, p6: p6?.result, p9: p9?.result, p10: p10?.result },
      truthData: { factCheck: factCheckData?.result, consistency: consistencyData?.result, unitEcon: unitEconData?.result, graveyard: graveyardData?.result, bias: biasData?.result },
      wave3: { preMortem: preMortemData?.result, debate: rawData.debate?.result, competitive: rawData.competitiveResponse?.result, apathy: rawData.apathy?.result }
    });



    // ═══ WAVE 4: Strategic Planning (Failures + Roadmap) ═══
    let roadmapData: any = null;
    setPhase(7); setPhaseName('Strategic Planning'); addLog('Developing failure pre-emption and industrial roadmap...');
    const wave4 = await Promise.allSettled([
      actions.runPhase7Failures(JSON.stringify(currentIdea), preMortemData?.result, researchSummary, auditToken),
      actions.runPhase7Roadmap(currentIdea, researchSummary, auditToken)
    ]);

    wave4.forEach((w, i) => {
      if (w.status === 'fulfilled') {
        const res = w.value as any;
        trackUsage(res);
        setCompletedSteps(prev => prev + 1);
        if (i === 0) { 
          p7 = res; 
          setRawData((prev: any) => ({ ...prev, p7 })); 
          addLog('Stress test ✓'); 
        } else { 
          roadmapData = res.result;
          setRawData((prev: any) => ({ ...prev, roadmap: res })); 
          addLog('Roadmap ✓'); 
        }
      } else {
        const label = i === 0 ? 'Expert Stress Test' : 'Industrial Roadmap';
        failed.push(label);
        addLog(`⚠️ ${label} failed`);
      }
    });

    // ═══ Final Scoring ═══
    try {
      setPhase(8); setPhaseName('Final Scoring'); addLog('Synthesizing Master Verdict...');
      const finalResult = await actions.finalizeAudit(currentIdea, fullResearchSummary, currentIdea.interrogationAnswers, auditToken);
      trackUsage(finalResult);
      setCompletedSteps(prev => prev + 1);
      
      setPhase(9); setPhaseName('Second Opinion'); addLog('Seeking Second Opinion...');
      const secondOp = await actions.runSecondOpinion(JSON.stringify(finalResult.result), fullResearchSummary, JSON.stringify({ bias: biasData?.result, factCheck: factCheckData?.result, consistency: consistencyData?.result }), auditToken);
      trackUsage(secondOp);
      setRawData((prev: any) => ({ ...prev, secondOpinion: secondOp }));
      setCompletedSteps(prev => prev + 1);

      const mergedResult = { 
        ...finalResult.result, 
        roadmap: roadmapData,
        pivotSuggestions: finalResult.pivotRaw ? safeJsonParse(finalResult.pivotRaw as string, null) : null,
        secondOpinion: secondOp.result
      };
      
      setResult(mergedResult);
      setRawData((prev: any) => ({ ...prev, final: finalResult }));
      setCompletedSteps(totalSteps);
      setPhase(10);
    } catch (err) { addLog('❌ Final scoring failed.'); failed.push('Final Scoring'); }

    // Check for JSON corruption in success paths
    Object.entries(rawData).forEach(([key, val]: [string, any]) => {
      if (val?.result?._parseError) {
        const labels: Record<string, string> = { 
          p1: 'Problem Reality', p2: 'Competitors', p3: 'Market Saturation', 
          p4: 'Feasibility', p5: 'Market & Monetization', p6: 'Differentiation',
          p_fit: 'Founder-Market Fit', syntheticData: 'Synthetic Research',
          p9: 'Regulatory', p10: 'Financial', roadmap: 'Roadmap', final: 'Final Scoring'
        };
        const label = labels[key] || key;
        if (!failed.includes(label)) failed.push(`${label} (Data Corrupted)`);
      }
    });

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
  const whyNowQ = getInputQuality(idea.whyNow, 50);
  const tractionQ = getInputQuality(idea.tractionEvidence, 40);
  const competitorsQ = getInputQuality(idea.competitorsInfo, 50);
  const monetizationQ = getInputQuality(idea.monetization, 30);
  const overallReady = idea.name.length > 1 && idea.industry.length > 1 && problemQ.level !== 'red' && solutionQ.level !== 'red' && whyNowQ.level !== 'red';

  return (
    <main className="min-h-screen p-8 lg:p-24 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0a0a0a_100%)] text-white font-sans scroll-smooth print:bg-white print:text-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {(activeTab !== 'dossier' && activeTab !== 'scoreboard') && !result && (
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
        {result?.dataQuality?.isSurfaceLevel && activeTab === 'dossier' && (
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
        {failedPhases.length > 0 && result && activeTab === 'dossier' && (
          <div className="max-w-4xl mx-auto mb-8 glass-card border-orange-500/50 !bg-orange-500/5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚡</span>
              <h3 className="text-lg font-black text-orange-400 uppercase">Partial Audit — {failedPhases.length} Phase(s) Failed</h3>
            </div>
            <p className="text-sm text-gray-400">The following phases encountered errors and their data is unavailable: <span className="text-orange-300 font-bold">{failedPhases.join(', ')}</span>. Scores may be less accurate.</p>
          </div>
        )}

        {/* Input Form with Quality Coaching */}
        {!result && phase === -1 && (
          <div className="max-w-2xl mx-auto glass-card animate-fade-in shadow-2xl shadow-purple-500/10">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">Initialize Idea</h2>
            <form onSubmit={startInterrogation} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Startup Name</label>
                  <input type="text" value={idea.name} onChange={(e) => setIdea({...idea, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all" placeholder="e.g. Acme AI" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Industry</label>
                  <select value={['FinTech','HealthTech','EdTech','FoodTech','E-Commerce','SaaS','AI/ML','Marketplace','Social','Gaming','Logistics','Real Estate','CleanTech','LegalTech','InsurTech','HRTech','DevTools','Crypto/Web3'].includes(idea.industry) ? idea.industry : 'custom'}
                    onChange={(e) => setIdea({...idea, industry: e.target.value === 'custom' ? '' : e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all">
                    <option value="custom">Custom / Other</option>
                    {['FinTech','HealthTech','EdTech','FoodTech','E-Commerce','SaaS','AI/ML','Marketplace','Social','Gaming','Logistics','Real Estate','CleanTech','LegalTech','InsurTech','HRTech','DevTools','Crypto/Web3'].map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {!['FinTech','HealthTech','EdTech','FoodTech','E-Commerce','SaaS','AI/ML','Marketplace','Social','Gaming','Logistics','Real Estate','CleanTech','LegalTech','InsurTech','HRTech','DevTools','Crypto/Web3'].includes(idea.industry) && (
                    <input type="text" value={idea.industry} onChange={(e) => setIdea({...idea, industry: e.target.value})}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 mt-2 focus:border-purple-500 outline-none transition-all" placeholder="Type your industry" required />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Target Customer</label>
                  <input type="text" value={idea.targetAudience} onChange={(e) => setIdea({...idea, targetAudience: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. SMB HR teams" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Market Locale</label>
                  <input type="text" value={idea.locale} onChange={(e) => setIdea({...idea, locale: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. USA, EU, Global" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your Total Capital (Budget)</label>
                  <input type="text" value={idea.budget} onChange={(e) => setIdea({...idea, budget: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. $5k (Self-funded), $100k (Angel)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Founder Background</label>
                  <input type="text" value={idea.founderBackground} onChange={(e) => setIdea({...idea, founderBackground: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. Senior Dev, 10yrs in Logistics" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Co-Founders (if any)</label>
                  <input type="text" value={idea.coFounders} onChange={(e) => setIdea({...idea, coFounders: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all"
                    placeholder="e.g. Solo, or names/backgrounds" />
                </div>
              </div>


              {/* Stage Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Stage</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'idea', label: '💡 Idea', desc: 'No code yet' },
                    { value: 'pre-revenue', label: '🔨 Pre-Revenue', desc: 'Building MVP' },
                    { value: 'revenue', label: '💰 Revenue', desc: 'Has paying users' },
                    { value: 'scaling', label: '🚀 Scaling', desc: '$10K+ MRR' },
                  ].map(s => (
                    <button key={s.value} type="button" onClick={() => setIdea({...idea, stage: s.value})}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        idea.stage === s.value ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                      }`}>
                      <span className="block text-sm font-bold">{s.label}</span>
                      <span className="block text-[9px] mt-1 opacity-60">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
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

              {/* Advanced VC Signals */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest">The Catalyst (Why Now?)</label>
                    <span className={`text-[9px] font-black uppercase ${whyNowQ.level === 'green' ? 'text-green-400' : 'text-yellow-400'}`}>{whyNowQ.label}</span>
                  </div>
                  <textarea value={idea.whyNow} onChange={(e) => setIdea({...idea, whyNow: e.target.value})}
                    className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all text-xs resize-none"
                    placeholder="Why today? Tech shift? Regulatory change? Market gap?" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black uppercase text-purple-400 tracking-widest">Traction & Proof</label>
                    <span className={`text-[9px] font-black uppercase ${tractionQ.level === 'green' ? 'text-green-400' : 'text-yellow-400'}`}>{tractionQ.label}</span>
                  </div>
                  <textarea value={idea.tractionEvidence} onChange={(e) => setIdea({...idea, tractionEvidence: e.target.value})}
                    className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all text-xs resize-none"
                    placeholder="List evidence: # of interviews, waitlist size, or pilot results." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 font-bold uppercase tracking-widest text-[10px] text-purple-400">Traction Artifacts (Docs/Analytics/Revenue)</label>
                <textarea value={idea.tractionDocs} onChange={(e) => setIdea({...idea, tractionDocs: e.target.value})}
                  className="w-full bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all text-xs resize-none"
                  placeholder="Paste summaries of revenue reports, analytics exports, or customer contracts for hard verification." />
              </div>


              {/* GTM & Marketing */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Marketing & Growth Engine</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold">Acquisition Channel</label>
                    <input type="text" value={idea.acquisitionChannel} onChange={(e) => setIdea({...idea, acquisitionChannel: e.target.value})}
                      className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-xs focus:border-purple-500 outline-none"
                      placeholder="e.g. SEO, TikTok, Direct Sales" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1 uppercase font-bold">Target Price / Unit</label>
                    <input type="text" value={idea.targetPricing} onChange={(e) => setIdea({...idea, targetPricing: e.target.value})}
                      className="w-full bg-black/30 border border-white/5 rounded-lg p-2 text-xs focus:border-purple-500 outline-none"
                      placeholder="e.g. \$49/mo, \$5k per contract" />
                  </div>
                </div>
              </div>

              {/* Revenue Model */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-400">Revenue Model</label>
                  <span className={`text-[10px] font-black uppercase ${monetizationQ.level === 'green' ? 'text-green-400' : monetizationQ.level === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{monetizationQ.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['SaaS Subscription', 'Freemium', 'Marketplace / Commission', 'Ads / Sponsorship', 'One-Time Purchase', 'API / Usage-Based'].map((model) => (
                    <button key={model} type="button" onClick={() => setIdea({ ...idea, monetization: idea.monetization.includes(model) ? idea.monetization.replace(model + '. ', '') : idea.monetization + model + '. ' })}
                      className={`text-[10px] px-3 py-2 rounded-lg border font-bold uppercase transition-all ${
                        idea.monetization.includes(model) ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'
                      }`}>{model}</button>
                  ))}
                </div>
                <input type="text" value={idea.monetization} onChange={(e) => setIdea({...idea, monetization: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 focus:border-purple-500 outline-none transition-all text-sm"
                  placeholder="e.g. SaaS $20/mo per seat, freemium tier for individuals" />
              </div>

              {/* Competitors — with quality meter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-400">Strategy & Competitors (Crucial)</label>
                  <span className={`text-[10px] font-black uppercase ${competitorsQ.level === 'green' ? 'text-green-400' : competitorsQ.level === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>{competitorsQ.label}</span>
                </div>
                <textarea value={idea.competitorsInfo} onChange={(e) => setIdea({...idea, competitorsInfo: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-24 focus:border-purple-500 outline-none transition-all resize-none"
                  placeholder="Who are the incumbents? How will you beat them?" />
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

              {/* Try Example */}
              <button type="button" onClick={() => setIdea({
                name: 'SolarStream', 
                problem: 'Residential solar owners lose 40-60% of their generated value by selling excess energy back to massive utility monopolies at "wholesale" rates (often $0.03/kWh) while their next-door neighbors buy that same power at retail rates ($0.18/kWh). Current Grid-Tie systems are predatory, and home batteries like Tesla Powerwalls have a 12-year ROI due to lack of intelligent arbitrage. There is no decentralized way to sell energy peer-to-peer at fair market value without being blocked by utility regulations.',
                solution: 'An AI-driven P2P energy exchange that turns home batteries into localized "Micro-Utilities." Our hardware-agnostic software predicts local grid demand surges 30 minutes in advance, and automatically sells stored battery power to neighbors or the local grid at "Retail-Minus" prices ($0.12/kWh). Key features: (1) Predictive AI Arbitrage Engine, (2) Regulatory-compliant "Virtual Power Plant" (VPP) status, (3) Direct IoT link to Powerwall/Enphase batteries, (4) Blockchain-settled sub-metering for transparent P2P billing.',
                industry: 'CleanTech',
                targetAudience: 'High-income residential solar/battery owners in "Deregulated" energy markets (Texas, California, Germany, UK) who want to weaponize their assets against traditional utilities.',
                monetization: 'Marketplace commission. We take 10% of the price delta between wholesale and P2P sales. Target LTV: $2,400 over 5 years. Hardware setup fee: $499 upfront.',
                competitorsInfo: 'Tesla Autobidder (Enterprise only, not P2P), OhmConnect (Manual rewards, low yield), LO3 Energy (Failed to scale). Gap: No consumer-facing platform offers automated, localized energy arbitrage with a focus on maximizing the "Neighbor-to-Neighbor" spread.',
                stage: 'pre-revenue',
                founderBackground: 'Solo founder. 12 years in Energy Trading (Ex-Enron/Citadel); Previously CTO of a failed BioTech startup; Decentralization maximalist with 200k followers on X.',
                budget: '$150,000 (Angel round). 14 months of runway with 3 engineers.',
                locale: 'Texas (ERCOT Market) & South Australia',
                whyNow: 'ERCOT recently legalized "Aggregated Distributed Energy Resources" (ADERs) for P2P-style VPP pilots. Battery costs have dropped 15% in 2024, and energy prices in Texas have surged 30% due to grid instability, making the "Spread" wider than ever.',
                tractionEvidence: 'Signed LOIs with 250 homeowners in Austin, TX for a Pilot. Successfully demonstrated a hardware-free software-only arbitrage test using the Tesla API with a 22% ROI improvement over 30 days. Have a partnership waitlist with 3 local residential solar installers.',
                targetPricing: '10% transaction fee + $25/mo subscription for "Pro Arbitrage" features.',
                acquisitionChannel: 'Partnerships with Solar Installers (Channel sales). Referral loops ("Refer a neighbor, earn 5% of their energy sales").',
                coFounders: 'None (Looking for a hardware-focused COO).',
                tractionDocs: 'API logs showing 22% yield improvement. List of 250 signed pilot participants with addresses and battery serial numbers. Letter of Intent from SunPower local representative.',
                interrogationAnswers: []
              })} className="w-full py-3 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-purple-400 transition-all border border-dashed border-white/10 rounded-xl hover:border-purple-500/30">
                💡 Try Example Idea
              </button>
            </form>
          </div>
        )}

        {/* Phase 0: Interactive Interrogation UI */}
        {interrogationActive && !loading && (
          <div className="max-w-4xl mx-auto glass-card animate-fade-in border-purple-500/50">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Phase 0: Input Interrogation</h2>
                <p className="text-gray-400 italic">The VC "Zero-Day" Cross-Examination</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-500 uppercase block mb-1">Specificity Score</span>
                <span className={`text-3xl font-black ${specificityScore < 30 ? 'text-red-500' : specificityScore < 75 ? 'text-yellow-500' : 'text-green-500'}`}>{specificityScore}%</span>
              </div>
            </div>

            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-8">
              <p className="text-sm text-red-300 font-bold">FEEDB@CK:</p>
              <p className="text-sm text-gray-300">{interrogationSuite?.feedback}</p>
            </div>

            <div className="space-y-8">
              {interrogationSuite?.interrogationSuite?.map((q: any) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <label className="text-sm font-bold text-white pr-8">Q: {q.question}</label>
                    <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-2 py-1 rounded uppercase tracking-widest">{q.targetMetric}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 italic">{q.context}</p>
                  <textarea 
                    value={interrogationAnswers[q.id] || ''} 
                    onChange={(e) => setInterrogationAnswers({...interrogationAnswers, [q.id]: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 h-20 focus:border-purple-500 outline-none transition-all text-sm resize-none"
                    placeholder="Provide specific details, quotes, or numbers..."
                  />
                </div>
              ))}
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={() => setInterrogationActive(false)} className="px-8 py-4 font-bold rounded-xl border border-white/10 text-gray-400 hover:bg-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleInterrogationSubmit} className="flex-1 py-4 font-black rounded-xl btn-premium transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                RE-EVALUATE & PROCEED
              </button>
            </div>
          </div>
        )}

        {/* Loading / Progress State */}
        {loading && (
          <div className="max-w-2xl mx-auto space-y-8 text-center py-20 animate-fade-in">
            <div className="relative inline-block">
              <div className="w-32 h-32 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin shadow-lg shadow-purple-500/20" />
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-purple-400">
                {Math.round((completedSteps / totalSteps) * 100)}%
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-2 text-white">
                {phase >= 0 && phase < 10 ? `Phase ${Math.floor(phase)}: ${phaseName}` : 'Finalizing...'}
              </h3>
              <p className="text-gray-400 italic">Executing cross-dimension validation...</p>
            </div>
            
            <div className="flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <div className="flex flex-col items-center">
                <span className="text-purple-400 text-sm">{auditUsage.tokens.toLocaleString()}</span>
                <span>Tokens Consumed</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-blue-400 text-sm">{auditUsage.searches}</span>
                <span>Tavily Credits</span>
              </div>
            </div>

            <div className="glass-card text-left bg-black text-xs font-mono p-4 opacity-70 border-white/5 shadow-inner max-h-48 overflow-y-auto">
              {logs.map((log, i) => <div key={i} className={`mb-1 ${log.startsWith('⚠️') ? 'text-orange-400' : log.startsWith('❌') ? 'text-red-400' : 'text-purple-300'}`}>{`> ${log}`}</div>)}
            </div>
          </div>
        )}

        {/* CommandCenter Navigation */}
        {result && phase === 10 && (
          <CommandCenter activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Result Header Buttons */}
        {result && (
          <div className="flex justify-end gap-4 print:hidden mb-8 animate-fade-in flex-wrap">
             <button onClick={() => { 
                setResult(null); 
                setPhase(-1); 
                setPhaseName(''); 
                setActiveTab('dossier'); 
                setChallenges(null); 
                setRawData({}); 
                setStressResults([]); 
                setStressTestResult(null); 
                setStressTestLoading(false); 
                setFailedPhases([]); 
                setLogs([]); 
                setStressTestInput(''); 
                clearSaved(); 
              }}
                className="px-6 py-2 border border-green-500/50 rounded-full text-xs font-black uppercase tracking-widest hover:bg-green-500/10 transition-all text-green-400">
                + New Audit
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

        {/* STRATEGIC DOSSIER VIEW */}
        {result && activeTab === 'dossier' && (
          <div className="animate-fade-in space-y-20 pb-24 dossier-view relative print:space-y-8">
             {/* 0. Strategic Ground Truth Header */}
             <div className="mb-12 animate-slide-up">
                <div className="flex justify-between items-end mb-8">
                   <div className="text-left">
                      <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{idea.name}</h2>
                      <p className="text-gray-400 font-serif italic text-xl mt-2">"The Strategic Ground Truth Synthesis"</p>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-black block mb-2">Verdict Status</span>
                      <span className={`px-6 py-2 rounded-full text-lg font-black uppercase border-2 ${
                         result.verdict === 'Greenlit for Testing' ? 'border-green-500 text-green-500 bg-green-500/10' :
                         result.verdict === 'Pivot Required' ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10' :
                         'border-red-500 text-red-500 bg-red-500/10'
                      }`}>{result.verdict || 'Indicted'}</span>
                   </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                   <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-3xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
                      <div className="relative z-10">
                         <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-1">The Core Bet</span>
                         <p className="text-xl text-white font-bold leading-tight">"{result.coreBet}"</p>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🎯</div>
                   </div>
                   <div className="p-8 bg-green-500/5 border border-green-500/20 rounded-3xl relative overflow-hidden group hover:border-green-500/40 transition-all">
                      <div className="relative z-10 space-y-4">
                          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-1">Triple-Constraint Validation ($500 ea.)</span>
                          <div className="grid gap-2">
                             <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-blue-400 block mb-0.5">Digital</span>
                                <p className="text-[11px] text-gray-300 leading-tight">"{result.tests?.digital}"</p>
                             </div>
                             <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-orange-400 block mb-0.5">Analog</span>
                                <p className="text-[11px] text-gray-300 leading-tight">"{result.tests?.analog}"</p>
                             </div>
                             <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                                <span className="text-[9px] uppercase font-bold text-purple-400 block mb-0.5">Wizard of Oz</span>
                                <p className="text-[11px] text-gray-300 leading-tight">"{result.tests?.wizardOfOz}"</p>
                             </div>
                          </div>
                       </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">⚡</div>
                   </div>
                   <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl relative overflow-hidden group hover:border-red-500/40 transition-all">
                      <div className="relative z-10">
                         <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block mb-1">The Stop Signal</span>
                         <p className="text-xl text-white font-bold leading-tight">"{result.stopSignal}"</p>
                      </div>
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">🛑</div>
                   </div>
                </div>
             </div>

             {/* I. Critical Assumption Stack */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-3xl font-black text-orange-500 flex items-center gap-4">
                   <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30">I</span>
                   CRITICAL ASSUMPTION STACK
                </h3>
                <div className="grid gap-6">
                   {result.criticalAssumptionStack?.map((item: any, i: number) => (
                      <div key={i} className={`p-8 rounded-3xl border-l-[12px] ${
                         item.lethality === 'Fatal' ? 'border-red-600 bg-red-600/5' : 'border-orange-500 bg-orange-500/5'
                      } relative group hover:scale-[1.01] transition-all`}>
                         <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                               <span className="text-4xl font-black opacity-20">0{item.rank || i+1}</span>
                               <h4 className="text-2xl font-black text-white">{item.assumption}</h4>
                            </div>
                            <div className="flex gap-2">
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.uncertainty === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                  {item.uncertainty} Uncertainty
                               </span>
                               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.lethality === 'Fatal' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                                  {item.lethality}
                               </span>
                            </div>
                         </div>
                         <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                            <h5 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3">Next 14-Day Test Agenda ($500 Max)</h5>
                            <p className="text-sm text-gray-300 font-medium leading-relaxed italic">"{item.testAgenda}"</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* II. Strategic Intelligence Officer (Research) */}
             {rawData.synthetic?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.4s' }}>
                   <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <h3 className="text-3xl font-black text-blue-400 flex items-center gap-4">
                         <span className="bg-blue-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-blue-500/30">II</span>
                         STRATEGIC INTELLIGENCE (PRIMARY SIGNALS)
                      </h3>
                      <div className="text-right">
                        <span className="text-[9px] text-gray-500 uppercase font-black block">Research Credibility</span>
                        <div className="flex gap-1 mt-1">
                          {[...Array(rawData.synthetic.result.researchCredibility?.tier1Count || 0)].map((_, i) => <span key={i} className="w-2 h-2 rounded-full bg-green-500" title="Tier 1"></span>)}
                          {[...Array(rawData.synthetic.result.researchCredibility?.tier2Count || 0)].map((_, i) => <span key={i} className="w-2 h-2 rounded-full bg-blue-500" title="Tier 2"></span>)}
                          {[...Array(rawData.synthetic.result.researchCredibility?.tier3Count || 0)].map((_, i) => <span key={i} className="w-2 h-2 rounded-full bg-yellow-500" title="Tier 3"></span>)}
                        </div>
                      </div>
                   </div>
                   
                   <p className="text-sm text-gray-400 italic">"{rawData.synthetic.result.researchCredibility?.summary}"</p>

                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        {rawData.synthetic.result.insights?.map((insight: any, i: number) => (
                           <div key={i} className="glass-card !bg-white/5 border border-white/10 group hover:border-blue-500/30 transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${insight.tier === 1 ? 'bg-green-500/20 text-green-400' : insight.tier === 2 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  Tier {insight.tier}: {insight.sourceType}
                                </span>
                                <span className={`text-[8px] font-black uppercase italic ${insight.verificationStatus === 'Confirmed' ? 'text-green-400' : 'text-orange-400'}`}>
                                  {insight.verificationStatus}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-white mb-2 leading-tight">{insight.claim}</p>
                              <p className="text-xs text-gray-400 leading-relaxed italic border-t border-white/5 pt-2 mt-2 group-hover:text-blue-200 transition-colors">
                                <span className="text-[9px] font-black uppercase text-blue-400 mr-2">Brutal Truth:</span>
                                {insight.brutalTruth}
                              </p>
                           </div>
                        ))}
                      </div>

                      <div className="space-y-4">
                        {/* Channel Squeeze */}
                        {rawData.synthetic.result.channelSqueeze && (
                          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl relative overflow-hidden">
                             <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">Channel Squeeze: {rawData.synthetic.result.channelSqueeze.channel}</span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${rawData.synthetic.result.channelSqueeze.mathCheck === 'Fatal' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                   {rawData.synthetic.result.channelSqueeze.mathCheck} MATH
                                </span>
                             </div>
                             <p className="text-xs text-gray-300 font-bold italic mb-4">"{rawData.synthetic.result.channelSqueeze.logic}"</p>
                             <div className="flex flex-wrap gap-2">
                                {rawData.synthetic.result.channelSqueeze.redFlags?.map((f: string, i: number) => (
                                   <span key={i} className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/10">⚠ {f}</span>
                                ))}
                             </div>
                          </div>
                        )}

                        {/* Tarpit Analysis */}
                        {rawData.synthetic.result.tarpitAnalysis && (
                          <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                             <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4 flex justify-between">
                                Graveyard Cross-Reference
                                <span className={`text-[8px] px-2 py-0.5 rounded ${rawData.synthetic.result.tarpitAnalysis.verdict === 'Tarpit' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                                   {rawData.synthetic.result.tarpitAnalysis.verdict}
                                </span>
                             </h4>
                             <div className="space-y-3 mb-4">
                                {rawData.synthetic.result.tarpitAnalysis.deadAncestors?.map((a: any, i: number) => (
                                   <div key={i} className="p-2 bg-black/40 rounded-lg border border-white/5">
                                      <p className="text-[10px] text-gray-300 font-bold">{a.name} — {a.failureReason}</p>
                                      <p className="text-[9px] text-gray-500 italic mt-1">{a.lesson}</p>
                                   </div>
                                ))}
                             </div>
                             <p className="text-xs text-purple-200 leading-tight border-t border-purple-500/20 pt-3 italic">
                               <span className="font-black">THE TRAP:</span> {rawData.synthetic.result.tarpitAnalysis.trapDescription}
                             </p>
                          </div>
                        )}

                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Simulated Discovery Interviews</h4>
                        {rawData.synthetic.result.interviewTranscripts?.slice(0, 1).map((t: any, i: number) => (
                          <div key={i} className="p-6 bg-black/40 rounded-2xl border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                              <span className="text-4xl font-black">💬</span>
                            </div>
                            <span className="text-[9px] text-blue-400 font-black uppercase block mb-4">{t.persona}</span>
                            <div className="space-y-3 mb-6 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
                              {t.dialogue?.map((d: any, idx: number) => (
                                <div key={idx} className={`p-2 rounded-lg text-xs ${d.speaker === 'Founder' ? 'bg-white/5 ml-4' : 'bg-blue-500/10 mr-4 border border-blue-500/20'}`}>
                                  <span className="font-black opacity-30 text-[8px] uppercase block mb-1">{d.speaker}</span>
                                  {d.text}
                                </div>
                              ))}
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[10px] text-blue-100 font-bold italic leading-tight">
                              "Keep in mind: {t.keyNugget}"
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </section>
              )}

             {/* III. Problem & Market Evidence */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">III</span>
                   PROBLEM & MARKET EVIDENCE
                </h3>
                {rawData.p1?.result && (
                  <div className="flex items-center gap-4 mb-2">
                     <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                       rawData.p1.result.confidenceScore >= 70 ? 'bg-green-500/20 text-green-400' :
                       rawData.p1.result.confidenceScore >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                     }`}>{rawData.p1.result.verdict || 'N/A'}</span>
                     <span className="text-xs text-gray-500 font-bold">Confidence: {rawData.p1.result.confidenceScore ?? '?'}%</span>
                  </div>
                )}
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="glass-card border border-white/5 space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Anthropological Evidence</h4>
                      <p className="text-lg text-gray-300 leading-relaxed font-medium italic print:text-gray-700">"{renderSafe(rawData.p1?.result?.reasoning) || "Data unavailable"}"</p>
                   </div>
                   <div className="glass-card border border-white/5">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Market Findings</h4>
                      <ul className="space-y-4">
                         {rawData.p1?.result?.verifyingEvidence?.map((e: any, i: number) => (
                           <li key={i} className="text-sm text-gray-400 p-3 bg-white/5 rounded-lg border-l-2 border-purple-500">{renderSafe(e.fact || e)}</li>
                         )) || <li className="text-sm text-gray-500 italic">No evidence available</li>}
                      </ul>
                   </div>
                </div>
             </section>

             {/* III-b. TRUTH VERIFICATION ENGINE */}
             {(rawData.factCheck?.result || rawData.consistency?.result) && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.45s' }}>
                   <div className="glass-card border-l-4 border-blue-500">
                      <h3 className="text-2xl font-black text-blue-400 mb-6 flex items-center gap-3 tracking-tighter uppercase relative">
                         <span className="absolute -left-12 top-0 text-xl">🔎</span>
                         Truth Verification & Consistency Check
                      </h3>
                      
                      <div className="grid lg:grid-cols-2 gap-8">
                         {rawData.factCheck?.result?.factChecks && (
                            <div>
                               <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Hard Fact Verification</h4>
                               <div className="space-y-3">
                                  {rawData.factCheck.result.factChecks.map((fc: any, i: number) => (
                                     <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                           <span className="text-[10px] text-gray-400 italic line-clamp-2 pr-4">"{fc.claim}"</span>
                                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${fc.verdict === 'True' ? 'bg-green-500/20 text-green-500' : fc.verdict === 'False' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{fc.verdict}</span>
                                        </div>
                                        <p className="text-xs text-white font-bold">{fc.reality}</p>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}

                         {rawData.consistency?.result?.contradictions && (
                            <div>
                               <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Internal Logic Contradictions</h4>
                               {rawData.consistency.result.contradictions.length > 0 ? (
                                  <div className="space-y-4">
                                     {rawData.consistency.result.contradictions.map((ct: any, i: number) => (
                                        <div key={i} className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                                           <div className="flex gap-2 items-center mb-2">
                                              <span className="text-lg">⚡</span>
                                              <span className="text-xs font-black text-orange-400 uppercase tracking-tight">{ct.issue}</span>
                                           </div>
                                           <p className="text-[10px] text-gray-300 italic">"{ct.explanation}"</p>
                                           <span className="text-[8px] mt-2 block font-black text-red-500 uppercase">Impact: {ct.impactSeverity}</span>
                                        </div>
                                     ))}
                                  </div>
                               ) : (
                                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                                     <span className="text-green-400 font-bold text-xs uppercase block">✓ Logic Verified</span>
                                     <span className="text-[10px] text-gray-400">No internal contradictions found across all generated insights.</span>
                                  </div>
                               )}
                            </div>
                         )}
                      </div>
                   </div>
                </section>
             )}

             {/* IV. Competitive Landscape */}
             <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">IV</span>
                   COMPETITIVE LANDSCAPE
                </h3>
                <div className="grid lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-6 tracking-widest">Incumbent Radar</h4>
                      <div className="grid gap-4">
                         {rawData.p2?.result?.directCompetitors?.map((c: any, i: number) => (
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
                      <p className="text-lg font-black mb-4 print:text-black">"{renderSafe(rawData.p3?.result?.saturationRisk) || "N/A"}"</p>
                      <p className="text-sm text-gray-400 leading-relaxed italic">{renderSafe(rawData.p3?.result?.brutalTruth)}</p>
                   </div>
                </div>

                {/* III.5. Competition Heatmap */}
                {rawData.p3?.result?.competitionDimensions && (
                  <div className="glass-card p-8 bg-[#0a0a0a] border-white/5 mt-6">
                     <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Market Dynamics Heatmap</h4>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Object.entries(rawData.p3.result.competitionDimensions).map(([dim, scoreObj]: [string, any]) => {
                           if (!scoreObj || typeof scoreObj !== 'object') return null;
                           const score = scoreObj.score || 0;
                           const colorClass = score >= 8 ? 'bg-red-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500';
                           return (
                             <div key={dim} className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                                <span className="text-[9px] uppercase font-black text-gray-500 mb-2 truncate" title={dim.replace(/([A-Z])/g, ' $1')}>{dim.replace(/([A-Z])/g, ' $1')}</span>
                                <div className="flex items-end gap-2">
                                   <span className={`text-2xl font-black ${score >= 8 ? 'text-red-400' : score >= 5 ? 'text-yellow-400' : 'text-green-400'}`}>{score}</span>
                                   <span className="text-xs text-gray-600 mb-1">/10</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full mt-2 overflow-hidden">
                                   <div className={`h-full ${colorClass}`} style={{ width: `${score * 10}%` }} />
                                </div>
                             </div>
                           );
                         })}
                      </div>
                   </div>
                 )}
              </section>

              {/* V. Psychological Friction */}
              {rawData.apathy?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.7s' }}>
                   <h3 className="text-3xl font-black text-orange-400 flex items-center gap-4">
                      <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30 font-mono">V</span>
                      PSYCHOLOGICAL FRICTION
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="glass-card">
                         <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Cognitive Load</h4>
                         <p className="text-lg text-gray-300 leading-relaxed font-medium italic">"{renderSafe(rawData.apathy.result.cognitiveLoad)}"</p>
                         <div className="mt-6 flex gap-4">
                            <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                               <span className="text-[10px] text-gray-500 uppercase block mb-1">Decision Fatigue</span>
                               <span className="font-black text-orange-400">{rawData.apathy.result.decisionFatigue || "N/A"}</span>
                            </div>
                            <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                               <span className="text-[10px] text-gray-500 uppercase block mb-1">Learning Curve</span>
                               <span className="font-black text-orange-400">{rawData.apathy.result.learningCurve || "N/A"}</span>
                            </div>
                         </div>
                      </div>
                      <div className="glass-card">
                         <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Emotional Barriers</h4>
                         <p className="text-lg text-gray-300 leading-relaxed font-medium italic">"{renderSafe(rawData.apathy.result.emotionalBarriers)}"</p>
                         <div className="mt-6 flex gap-4">
                            <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                               <span className="text-[10px] text-gray-500 uppercase block mb-1">Trust Deficit</span>
                               <span className="font-black text-orange-400">{rawData.apathy.result.trustDeficit || "N/A"}</span>
                            </div>
                            <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                               <span className="text-[10px] text-gray-500 uppercase block mb-1">Fear of Change</span>
                               <span className="font-black text-orange-400">{rawData.apathy.result.fearOfChange || "N/A"}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </section>
              )}

              {/* VI. Financial Survival Skeleton */}
              {rawData.p10?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '0.8s' }}>
                   <h3 className="text-3xl font-black text-green-500 flex items-center gap-4">
                      <span className="bg-green-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-green-500/30">VI</span>
                      FINANCIAL SURVIVAL SKELETON
                   </h3>
                   <div className="grid lg:grid-cols-4 gap-4">
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-black block mb-2">Max Affordable CAC</span>
                          <span className="text-2xl font-black text-green-400 font-mono tracking-tighter">${rawData.p10.result.survivalSkeleton?.maxAffordableCAC}</span>
                       </div>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-black block mb-2">Min Survival Churn (180d)</span>
                          <span className="text-2xl font-black text-red-500 font-mono tracking-tighter">{rawData.p10.result.survivalSkeleton?.minSurvivalChurn}%</span>
                       </div>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-black block mb-2">Burn to Milestone</span>
                          <span className="text-2xl font-black text-orange-400 font-mono tracking-tighter">${rawData.p10.result.survivalSkeleton?.burnToFirstMilestone}</span>
                       </div>
                       <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                          <span className="text-[10px] text-gray-500 uppercase font-black block mb-2">6-Mo ACV Floor</span>
                          <span className="text-2xl font-black text-white font-mono tracking-tighter">${rawData.p10.result.survivalSkeleton?.minTargetACV}</span>
                       </div>
                   </div>
                   <div className="grid lg:grid-cols-2 gap-4">
                       <div className="glass-card !bg-red-500/5 border-red-500/30 relative">
                          <div className="absolute top-4 right-4 text-[8px] font-black text-red-500 uppercase tracking-widest">MANDATORY DEATH CLOCK</div>
                          <h4 className="text-xs font-black text-red-400 uppercase tracking-widest mb-6">THE BURN RATE GUILLOTINE</h4>
                          <div className="flex items-center gap-6 mb-6">
                             <div className="text-6xl font-black text-white">{rawData.p10.result.deathGuillotine?.monthsToZero}</div>
                             <div className="flex flex-col">
                                <span className="text-xl font-black text-red-500 uppercase tracking-tighter">Months to Zero</span>
                                <span className="text-xs text-gray-500 font-mono italic">Cash-out: {rawData.p10.result.deathGuillotine?.cashOutDate}</span>
                             </div>
                          </div>
                          <p className="text-xs text-gray-400 leading-normal mb-4 italic">"{rawData.p10.result.deathGuillotine?.burnBreakdown}"</p>
                          <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/20">
                             <span className="text-[9px] text-red-400 font-black uppercase block mb-1">Fatal Constraint</span>
                             <p className="text-sm font-bold text-white">{rawData.p10.result.deathGuillotine?.fatalConstraint}</p>
                          </div>
                       </div>
                       <div className="glass-card !bg-green-500/5 border-green-500/20">
                          <h4 className="text-xs font-black text-green-400 uppercase tracking-widest mb-4">Breakeven Conditions</h4>
                          <p className="text-sm text-gray-200 font-bold mb-6 italic leading-relaxed">"{rawData.p10.result.breakevenConditions}"</p>
                          <div className="grid gap-4">
                            {rawData.p10.result.stressTests?.slice(0, 2).map((test: any, i: number) => (
                               <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-[10px] text-orange-400 font-black uppercase block mb-1">Stress: {test.scenario}</span>
                                  <p className="text-xs text-gray-400 leading-tight">{test.impact}</p>
                               </div>
                            ))}
                          </div>
                       </div>
                    </div>
                </section>
             )}

             {/* VII. Apathy Simulator (USER INDIFFERENCE) */}
              {rawData.apathy?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.0s' }}>
                   <div className="flex justify-between items-end border-b border-white/5 pb-4">
                      <h3 className="text-3xl font-black text-red-400 flex items-center gap-4">
                         <span className="bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/30">VII</span>
                         APATHY SIMULATOR
                      </h3>
                      <div className="text-right">
                         <span className="text-[9px] text-gray-500 uppercase font-black block">Apathy Score</span>
                         <span className={`text-2xl font-black ${rawData.apathy.result.apathyScore < 4 ? 'text-red-500' : rawData.apathy.result.apathyScore < 7 ? 'text-orange-500' : 'text-green-500'}`}>
                            {rawData.apathy.result.apathyScore}/10
                         </span>
                      </div>
                   </div>

                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="p-8 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden">
                         <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">The Indifference Argument</h4>
                         <p className="text-xl text-white font-bold italic leading-relaxed mb-6">"{rawData.apathy.result.indifferenceArgument}"</p>
                          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-8">
                             <span className="text-[10px] text-red-400 font-black uppercase tracking-widest block mb-2 font-mono">Switching Cost: {rawData.apathy.result.switchingCost}</span>
                             <p className="text-xs text-gray-300 font-bold italic">"Brutal Truth: {rawData.apathy.result.brutalTruth}"</p>
                          </div>

                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Psychological Friction Points</h4>
                             {rawData.apathy.result.psychologicalFriction?.map((f: any, i: number) => (
                                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-white/30 transition-all">
                                   <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-black text-white uppercase">{f.point}</span>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${f.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                         {f.severity} FRICTION
                                      </span>
                                   </div>
                                   <p className="text-[11px] text-gray-400 italic">"{f.reason}"</p>
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="glass-card !bg-red-500/5 border-red-500/40 relative">
                          <div className="absolute top-4 right-4 text-[8px] font-black text-red-500 uppercase tracking-widest">MANDATORY EMPIRICAL PROOF</div>
                          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">ACTION-BASED FRICTION TEST</h4>
                          <div className="p-6 bg-black/40 border border-white/5 rounded-2xl mb-6">
                             <span className="text-[9px] text-gray-500 uppercase block mb-2">The Value Hook</span>
                             <p className="text-lg text-white font-black italic leading-tight animate-pulse">"{rawData.apathy.result.empiricalTest?.proposition}"</p>
                          </div>
                          <div className="space-y-4">
                             <div className="flex gap-4 items-center">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center flex-1">
                                   <span className="text-[9px] text-gray-500 uppercase block mb-1">Target Action</span>
                                   <span className="text-sm font-black text-red-500">{rawData.apathy.result.empiricalTest?.threshold}</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center flex-1">
                                   <span className="text-[9px] text-gray-500 uppercase block mb-1">Time Limit</span>
                                   <span className="text-sm font-black text-red-500">48 HOURS</span>
                                </div>
                             </div>
                             <p className="text-[10px] text-gray-400 text-center italic">"Algorithm analysis is a guess. This test is the only truth."</p>
                          </div>
                       </div>
                    </div>
                </section>
              )}
              {/* VII-b. Expert Stress Test Failure Scenarios */}
              {rawData.p7?.result?.failureScenarios && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.2s' }}>
                   <h3 className="text-3xl font-black text-red-500 flex items-center gap-4">
                      <span className="bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/30 text-lg">VII-b</span>
                      EXPERT FAILURE SCENARIOS (P7)
                   </h3>
                   <div className="grid lg:grid-cols-3 gap-6">
                      {rawData.p7.result.failureScenarios.map((s: any, i: number) => (
                        <div key={i} className="glass-card border-red-500/20">
                           <div className="flex justify-between items-start mb-4">
                              <span className="text-xs font-black text-red-400 uppercase tracking-widest">{s.scenario}</span>
                              <span className="text-[10px] font-black bg-red-500/20 text-red-500 px-2 py-0.5 rounded italic font-mono">
                                 {s.probability}% PROB
                              </span>
                           </div>
                           <p className="text-sm text-gray-300 italic mb-4">"{s.mechanism}"</p>
                           <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                              <span className="text-[9px] text-gray-400 uppercase font-black block mb-1">Expert Mitigation</span>
                              <p className="text-xs text-white font-bold">{s.mitigation}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                   {rawData.p7.result.mostLikelyDeathCause && (
                     <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-3xl">
                        <span className="text-[10px] text-red-400 font-black uppercase tracking-widest block mb-1 underline">Most Likely Death Cause</span>
                        <p className="text-2xl font-black text-white italic leading-tight">"{rawData.p7.result.mostLikelyDeathCause}"</p>
                     </div>
                   )}
                </section>
              )}

             {/* VIII. Execution Dossier */}
              <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.4s' }}>
                 <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                    <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">VIII</span>
                    EXECUTION DOSSIER
                 </h3>
                 <div className="grid lg:grid-cols-2 gap-8">
                    <div className="glass-card">
                       <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Feasibility Analysis</h4>
                       <p className="text-gray-300 leading-relaxed font-bold italic print:text-gray-700">"{renderSafe(rawData.p4?.result?.complexityAssessment) || "N/A"}"</p>
                       <div className="mt-6 flex gap-4">
                          <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                             <span className="text-[10px] text-gray-500 uppercase block mb-1">Budget Path</span>
                             <span className="font-black text-orange-400">{rawData.p4?.result?.bestBudgetPath || "N/A"}</span>
                          </div>
                          <div className="flex-1 p-4 bg-white/5 rounded-xl text-center border border-white/5">
                             <span className="text-[10px] text-gray-500 uppercase block mb-1">Time to MVP</span>
                             <span className="font-black text-orange-400">{rawData.p4?.result?.timeToMVP || "N/A"}</span>
                          </div>
                       </div>
                    </div>
                    <div className="glass-card">
                       <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Asymmetric Advantage</h4>
                       <p className="text-lg text-green-400 font-black mb-4 underline decoration-green-500/30 font-mono tracking-tighter uppercase">{renderSafe(rawData.p6?.result?.primaryAdvantage) || "N/A"}</p>
                       <p className="text-sm text-gray-400 italic mb-4">Strategy: {renderSafe(rawData.p6?.result?.differentiationStrategy)}</p>
                       {rawData.p6?.result?.signals && (
                         <div className="grid gap-2 mt-4 pt-4 border-t border-white/5">
                            {rawData.p6.result.signals.map((sig: any, i: number) => (
                              <div key={i} className={`p-3 rounded-lg text-xs flex items-start gap-2 ${sig.type === 'green' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                 <span className={`font-black mt-px ${sig.type === 'green' ? 'text-green-400' : 'text-red-400'}`}>{sig.type === 'green' ? '✓' : '⚠'}</span>
                                 <div>
                                    <p className={`font-bold ${sig.type === 'green' ? 'text-green-300' : 'text-red-300'}`}>{renderSafe(sig.text)}</p>
                                    <p className="text-gray-500 italic mt-1">{renderSafe(sig.impact)}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
              </section>

              {/* IX. Unit Economics & Exit Engine */}
              <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.6s' }}>
                 <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                    <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">IX</span>
                    UNIT ECONOMICS & EXIT ENGINE
                 </h3>
                 <div className="grid lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-6 tracking-widest">Financial Architecture</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {rawData.p10?.result?.unitEconomics && Object.entries(rawData.p10.result.unitEconomics).map(([key, val]) => (
                          <div key={key} className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                            <span className="text-[9px] text-gray-500 uppercase block mb-1">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-lg font-black text-purple-400">{String(val)}{key.toLowerCase().includes('score') || key.toLowerCase().includes('ratio') ? '' : key.toLowerCase().includes('margin') ? '%' : '$'}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block mb-2">Funding Roadmap</span>
                        <p className="text-sm text-gray-300">{rawData.p10?.result?.fundingRequiredToScale}</p>
                        <p className="text-[10px] text-gray-500 mt-2 uppercase">Intensity: {rawData.p10?.result?.capitalIntensity}</p>
                      </div>
                   </div>
                   <div className="glass-card">
                      <h4 className="text-xs font-black text-gray-500 uppercase mb-6 tracking-widest flex justify-between items-center">
                        <span>Exit Scenarios</span>
                      </h4>
                      
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-6">
                        <p className="text-[10px] text-purple-400 font-bold leading-tight flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                          Stress Testing Available below in Section XVIII
                        </p>
                      </div>
                      <div className="text-5xl font-black text-white mb-2">{rawData.p10?.result?.exitScore}/100</div>

                      <span className="text-[10px] text-gray-500 uppercase block mb-6">Exit Probability Score</span>
                      <div className="space-y-4">
                        {rawData.p10?.result?.exitScenarios?.map((s: any, i: number) => (
                          <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/5 group hover:bg-white/10 transition-all">
                            <p className="text-sm font-black text-white">{s.acquirer}</p>
                            <p className="text-[10px] text-purple-400 font-bold mb-1">{s.estimatedMultiple}</p>
                            <p className="text-[10px] text-gray-400 italic leading-tight">{s.logic}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                 </div>
              </section>

              {/* X. IP & Regulatory Fortress */}
              <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '1.8s' }}>
                <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4 print:text-purple-700">
                   <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30 text-lg">X</span>
                   IP & REGULATORY FORTRESS
                </h3>
                {rawData.p9?.result && (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="glass-card">
                       <h4 className="text-xs font-black text-gray-500 uppercase mb-4">Regulatory Friction</h4>
                       <div className="flex items-center gap-4 mb-6">
                         <div className="text-5xl font-black text-white">{rawData.p9.result.regulatoryFriction}/10</div>
                         <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all ${rawData.p9.result.regulatoryFriction >= 7 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${rawData.p9.result.regulatoryFriction * 10}%` }} />
                         </div>
                       </div>
                       <p className="text-sm text-gray-400 italic mb-6">"{rawData.p9.result.complianceMoatStrategy}"</p>
                       <div className="space-y-3">
                         {rawData.p9.result.requiredCompliances?.map((c: any, i: number) => (
                           <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                             <div className="flex flex-col">
                               <span className="text-xs font-bold text-white">{c.framework}</span>
                               <span className="text-[9px] text-gray-500 uppercase">{c.timeline}</span>
                             </div>
                             <span className={`text-[9px] font-black px-2 py-1 rounded ${c.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{c.priority}</span>
                           </div>
                         ))}
                       </div>
                    </div>
                    <div className="glass-card">
                       <h4 className="text-xs font-black text-gray-500 uppercase mb-4">IP Risk & Landmines</h4>
                       <div className="text-2xl font-black text-purple-400 mb-4">IP Defense Score: {rawData.p9.result.ipScore}%</div>
                       <div className="grid gap-3">
                         {rawData.p9.result.keyLandmines?.map((l: any, i: number) => (
                           <div key={i} className={`p-4 rounded-xl border-l-4 ${l.severity === 'High' ? 'border-red-500 bg-red-500/5' : 'border-yellow-500 bg-yellow-500/5'}`}>
                             <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{l.type}</p>
                             <p className="text-xs text-gray-200">{l.risk}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </section>

              {/* XI. Founder Capability Gap Interview */}
              {rawData.p_fit?.result && (
                 <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.0s' }}>
                    <h3 className="text-3xl font-black text-blue-400 flex items-center gap-4">
                       <span className="bg-blue-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-blue-500/30">XI</span>
                       FOUNDER CAPABILITY GAP INTERVIEW
                    </h3>
                    
                    {/* Founder Reality Check (Gap 7) */}
                    <div className="glass-card border-l-4 border-red-500 !bg-red-500/5 mb-8">
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xs font-black text-red-500 uppercase tracking-widest">THE FOUNDER REALITY CHECK</h4>
                          <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded font-black">FATAL IF FAKED</span>
                       </div>
                       <p className="text-lg text-white font-black italic mb-4 leading-tight">"{rawData.p_fit.result.realityCheck?.question}"</p>
                       <div className="grid lg:grid-cols-2 gap-4">
                          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                             <span className="text-[9px] text-gray-500 uppercase block mb-1">Execution Bottleneck</span>
                             <p className="text-xs text-gray-300 font-bold">{rawData.p_fit.result.realityCheck?.targetBottleneck}</p>
                          </div>
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                             <span className="text-[9px] text-red-400 font-black uppercase block mb-1">Failure Signal</span>
                             <p className="text-xs text-red-200 italic">{rawData.p_fit.result.realityCheck?.failureSignal}</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                       <div className="lg:col-span-2 space-y-4">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Authority Probe</h4>
                          {rawData.p_fit.result.capabilityGapInterview?.map((q: any, i: number) => (
                             <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl group hover:border-blue-500/30 transition-all">
                                <div className="flex gap-4 items-start">
                                   <span className="text-lg font-serif opacity-30 text-blue-400">?</span>
                                   <div className="flex-1">
                                      <p className="text-sm font-bold text-white mb-2">{q.question}</p>
                                      <p className="text-[10px] text-gray-500 leading-relaxed italic">{q.whyItMatters}</p>
                                   </div>
                                   <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${q.severity === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                      {q.severity} Gap
                                   </span>
                                </div>
                             </div>
                          ))}
                       </div>
                       <div className="space-y-6">
                          <div className="glass-card border-l-4 border-blue-500 !bg-blue-500/5">
                             <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Missing Skillsets</h4>
                             <ul className="space-y-3">
                                {rawData.p_fit.result.missingSkillsets?.map((s: any, i: number) => (
                                   <li key={i} className="text-xs text-gray-300 font-bold flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      {s}
                                   </li>
                                ))}
                             </ul>
                          </div>
                           <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                              <span className="text-[9px] text-gray-500 uppercase font-black block mb-2">The Unfair Advantage</span>
                              <p className="text-xs text-blue-100 font-bold italic leading-tight">"{rawData.p_fit.result.unfairAdvantage}"</p>
                           </div>
                        </div>
                     </div>
                  </section>
               )}

             {/* XII. Pre-Mortem: Socratic Death Simulation */}
             {rawData.preMortem?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.2s' }}>
                   <h3 className="text-3xl font-black text-red-500 flex items-center gap-4">
                      <span className="bg-red-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-red-500/30">XII</span>
                      SOCRATIC DEATH SIMULATION
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fatal Death Scenarios</h4>
                         {rawData.preMortem.result.fatalScenarios?.map((s: any, i: number) => (
                            <div key={i} className={`p-6 rounded-2xl border ${s.probability === 'High' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                               <h5 className="text-md font-black text-white mb-2 uppercase tracking-tighter">{s.name}</h5>
                               <p className="text-xs text-gray-400 leading-relaxed mb-4 italic">"{s.description}"</p>
                               <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${s.probability === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                  Probability: {s.probability}
                               </span>
                            </div>
                         ))}
                      </div>
                      <div className="space-y-6">
                         <div className="glass-card !bg-red-500/5 border-red-500/20">
                            <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-6 border-b border-red-500/10 pb-2">The Socratic Probe</h4>
                            <div className="space-y-6">
                               {rawData.preMortem.result.socraticDialogue?.map((d: any, i: number) => (
                                  <div key={i} className="group">
                                     <p className="text-sm font-black text-white italic group-hover:text-red-400 transition-colors">"{d.question}"</p>
                                     <div className="flex justify-between mt-2">
                                        <span className="text-[8px] text-gray-500 uppercase font-black">Targeting: {d.targetRisk}</span>
                                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{d.urgency}</span>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                         <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-[9px] text-green-400 uppercase font-black mb-3">Immediate Countermeasures</h4>
                            <ul className="space-y-2">
                               {rawData.preMortem.result.immediateCountermeasures?.map((c: any, i: number) => (
                                  <li key={i} className="text-[10px] text-gray-300 flex items-center gap-2">
                                     <span className="w-1 h-1 rounded-full bg-green-500"></span>
                                     {c}
                                  </li>
                               ))}
                            </ul>
                         </div>
                      </div>
                   </div>
                   <div className="p-4 text-center border-y border-white/10 italic">
                      <p className="text-lg font-serif text-gray-400">"{rawData.preMortem.result.closingThought}"</p>
                    </div>

                    {/* expert failures section (Fix 14) */}
                    {rawData.p7?.result && (
                       <div className="mt-12 glass-card border-l-4 border-red-600 !bg-red-600/5">
                          <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Expert Failure Stress Scenarios (Historical Rank)</h4>
                          <div className="grid lg:grid-cols-3 gap-6">
                             {rawData.p7.result.failureScenarios?.map((s: any, i: number) => (
                                <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5 transition-all hover:border-red-500/30">
                                   <div className="flex justify-between mb-2">
                                      <span className="text-[8px] font-black text-gray-500 uppercase">Rank #{i+1}</span>
                                      <span className="text-[8px] font-black text-red-500 uppercase">{s.probability} Probability</span>
                                   </div>
                                   <h5 className="text-xs font-black text-white mb-2 underline decoration-red-500/20">{s.scenario}</h5>
                                   <p className="text-[10px] text-gray-400 italic mb-4 leading-tight">"{s.mitigation}"</p>
                                   <div className="text-[8px] font-black text-gray-600 uppercase">Fatal Loop: {s.fatalLoop}</div>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}
                 </section>
             )}

             {/* XII-b. STARTUP GRAVEYARD (SURVIVORSHIP BIAS) */}
             {rawData.graveyard?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.3s' }}>
                   <h3 className="text-3xl font-black text-gray-500 flex items-center gap-4">
                      <span className="bg-gray-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-gray-500/30">✝</span>
                      STARTUP GRAVEYARD (SURVIVORSHIP BIAS)
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                     <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Historical Causalities</h4>
                       {rawData.graveyard.result.similarFailures?.map((f: any, i: number) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-gray-500/30">
                             <div className="flex justify-between items-center mb-2">
                               <span className="text-sm font-black text-white uppercase">{f.companyName}</span>
                               <span className="text-[9px] font-black text-gray-500 bg-black px-2 py-0.5 rounded">{f.era}</span>
                             </div>
                             <p className="text-xs text-red-400 font-bold mb-2">Fatal Flaw: {f.fatalFlaw}</p>
                             <p className="text-[10px] text-gray-400 italic">"Why they actually died: {f.realReasonForDeath}"</p>
                          </div>
                       ))}
                     </div>
                     <div className="space-y-6">
                        <div className="glass-card !bg-gray-900/50 border-gray-700/50">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">The Shared Delusion</h4>
                           <p className="text-sm text-gray-300 italic mb-6 leading-relaxed">"{rawData.graveyard.result.sharedDelusion}"</p>
                           <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block mb-2">How to Survive Where They Failed</span>
                              <p className="text-xs text-white font-bold leading-tight">"{rawData.graveyard.result.howToSurviveWhereTheyFailed}"</p>
                           </div>
                        </div>
                     </div>
                   </div>
                </section>
             )}

             {/* XIII. Regulatory IQ & Capability Gap */}
             {rawData.p9?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.4s' }}>
                   <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                      <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30">XIII</span>
                      REGULATORY IQ & CAPABILITY GAP
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                     <div className="space-y-6">
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">The 7 Critical Questions</h4>
                       <div className="grid gap-4">
                         {rawData.p9.result.criticalQuestions?.map((q: any, i: number) => (
                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                               <p className="text-xs font-bold text-white mb-2 leading-tight">Q: {q.question}</p>
                               <div className="flex justify-between">
                                  <span className="text-[8px] text-gray-500 uppercase">Impact: {q.impact}</span>
                                  <span className={`text-[8px] font-black uppercase ${q.priority === 'CRITICAL' ? 'text-red-500' : 'text-blue-400'}`}>{q.priority}</span>
                               </div>
                            </div>
                         ))}
                       </div>
                     </div>
                     <div className="space-y-6">
                       <div className="glass-card !bg-purple-500/5 border-purple-500/20">
                          <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">Compliance Moat Strategy</h4>
                          <p className="text-sm text-gray-200 font-bold italic leading-relaxed">"{rawData.p9.result.complianceMoat}"</p>
                       </div>
                       <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Required Strategic Advisors</h4>
                          <div className="flex flex-wrap gap-2">
                             {rawData.p9.result.requiredAdvisors?.map((a: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-[10px] font-black uppercase">{a}</span>
                             ))}
                          </div>
                       </div>
                       <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                          <span className="text-[9px] text-red-500 font-black uppercase tracking-widest block mb-1">Complexity Warning</span>
                          <p className="text-xs text-gray-400 leading-tight">"{rawData.p9.result.regulatoryComplexity}"</p>
                       </div>
                     </div>
                   </div>
                </section>
             )}

             {/* XIV. Competitive Retaliation Simulation */}
             {rawData.competitiveResponse?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.6s' }}>
                   <h3 className="text-3xl font-black text-orange-400 flex items-center gap-4">
                      <span className="bg-orange-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-orange-500/30">XIV</span>
                      COMPETITIVE RETALIATION SIMULATION
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Incumbent Retaliation Playbook</h4>
                         {rawData.competitiveResponse.result.retaliationMoves?.map((m: any, i: number) => (
                            <div key={i} className={`p-6 rounded-2xl border ${m.lethality === 'Fatal' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                               <div className="flex justify-between items-start mb-4">
                                  <span className="text-xs font-black text-white uppercase">{m.competitor}</span>
                                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${m.lethality === 'Fatal' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                     {m.lethality}
                                  </span>
                               </div>
                               <h5 className="text-md font-bold text-white mb-2">{m.move}</h5>
                               <p className="text-[10px] text-gray-400 italic">Probability: {m.probability}</p>
                            </div>
                         ))}
                      </div>
                      <div className="space-y-6">
                         <div className="glass-card !bg-orange-500/5 border-orange-500/20">
                            <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-6 underline decoration-orange-500/20">Silent Killer & Unscalable Moat</h4>
                            <div className="space-y-4">
                               <div className="p-4 bg-black/40 rounded-xl border border-orange-500/10">
                                  <span className="text-[9px] text-orange-500 font-black uppercase block mb-2">The Silent Killer</span>
                                  <p className="text-md font-black text-white mb-2">{rawData.competitiveResponse.result.silentKiller?.name}</p>
                                  <p className="text-xs text-gray-400 italic">"{rawData.competitiveResponse.result.silentKiller?.pivotLogic}"</p>
                                  <span className="text-[8px] font-black uppercase text-red-500 mt-2 block">Threat: {rawData.competitiveResponse.result.silentKiller?.threatLevel}</span>
                               </div>
                               <div className="p-4 bg-purple-500/5 rounded-xl border border-purple-500/20">
                                  <span className="text-[9px] text-purple-400 font-black uppercase block mb-1">Unscalable Advantage</span>
                                  <p className="text-xs text-gray-200 font-bold italic">"{rawData.competitiveResponse.result.unscalableAdvantage}"</p>
                               </div>
                            </div>
                         </div>
                         <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                            <span className="text-[9px] text-green-400 font-black uppercase tracking-widest block mb-2">Defensive Posture</span>
                            <p className="text-sm text-gray-300 font-bold">"{rawData.competitiveResponse.result.competitiveMoat}"</p>
                         </div>
                      </div>
                   </div>
                </section>
             )}

             {/* XV. Adversarial Council: Ground Truth */}
             {rawData.debate?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '2.8s' }}>
                   <h3 className="text-3xl font-black text-blue-400 flex items-center gap-4">
                      <span className="bg-blue-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-blue-500/30">XV</span>
                      ADVERSARIAL COUNCIL: GROUND TRUTH
                   </h3>
                   <div className="grid lg:grid-cols-2 gap-8">
                     <div className="p-8 bg-blue-500/5 border border-blue-500/30 rounded-3xl">
                       <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">The Synthesis</h4>
                       <p className="text-xl text-white font-bold italic leading-relaxed mb-8">"{rawData.debate.result.groundTruth}"</p>
                       <div className="space-y-3">
                          <div className="p-3 bg-white/5 rounded-lg">
                             <span className="text-[9px] text-gray-500 uppercase block mb-1">Unresolved Conflict</span>
                             <p className="text-xs text-orange-400 italic">"{rawData.debate.result.unresolvedConflict}"</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg">
                             <span className="text-[9px] text-gray-500 uppercase block mb-1">Evidence Strength</span>
                             <p className="text-xs text-green-400 font-black">{rawData.debate.result.evidenceStrength}</p>
                          </div>
                       </div>
                     </div>
                     <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Historical Precedent (Cite)</h4>
                       <div className="p-6 bg-black/40 rounded-2xl border border-white/5 italic">
                          <p className="text-sm text-gray-300">"{rawData.debate.result.historicalPrecedent}"</p>
                       </div>
                     </div>
                   </div>
                </section>
             )}

             {/* XVI. The Industrial Roadmap (BLITZ) */}
             {result.roadmap && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '3.0s' }}>
                   <h3 className="text-3xl font-black text-purple-400 flex items-center gap-4">
                      <span className="bg-purple-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-purple-500/30 font-mono">XVI</span>
                      THE INDUSTRIAL ROADMAP (BLITZ)
                   </h3>
                   <div className="grid lg:grid-cols-3 gap-6">
                      {result.roadmap.phases?.map((p: any, idx: number) => (
                        <div key={idx} className="glass-card border-t-4 border-purple-500 transition-all hover:translate-y-[-4px]">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="text-lg font-black text-white underline decoration-purple-500/50">{p.name}</h4>
                              <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-black">{p.duration}</span>
                           </div>
                           <ul className="space-y-4">
                              {p.tasks?.map((t: any, tidx: number) => (
                                <li key={tidx} className="group">
                                   <div className="flex gap-3">
                                      <span className={`w-2 h-2 mt-1.5 flex-shrink-0 rounded-full ${t.priority === 'High' ? 'bg-red-500' : t.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                      <div>
                                         <p className="text-sm text-gray-200 font-bold leading-tight">{t.task}</p>
                                         <p className="text-[10px] text-gray-500 mt-1">{t.description}</p>
                                      </div>
                                   </div>
                                </li>
                              ))}
                           </ul>
                        </div>
                      ))}
                   </div>
                </section>
             )}

             {/* XVII. FINAL CONFLICT RESOLUTION & REASONING */}
             <section className="space-y-12 animate-slide-up" style={{ animationDelay: '2s' }}>
                <div className="glass-card bg-white/5 border-white/10 p-12 text-center">
                   <span className="text-[10px] text-gray-500 uppercase font-black block mb-4">Board Perspective</span>
                   <p className="text-2xl font-bold text-gray-200 leading-relaxed max-w-4xl mx-auto italic">"{result.reasoning}"</p>
                </div>

             <div className="grid lg:grid-cols-2 gap-8 mt-12">
                {/* Vulnerability Scan */}
                {result.vulnerabilityScan && (
                   <div className="glass-card border-red-500/30 bg-red-500/5">
                      <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Vulnerability Scan (Internal Red Flags)</h4>
                      <div className="space-y-4">
                         {result.vulnerabilityScan.map((v: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                               <span className="text-red-500 font-mono font-bold">0{i+1}</span>
                               <p className="text-sm text-gray-300 font-bold">{v}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Opportunity Scan */}
                {result.opportunityScan && (
                   <div className="glass-card border-green-500/30 bg-green-500/5">
                      <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-6">Opportunity Scan (Asymmetric Green Flags)</h4>
                      <div className="space-y-4">
                         {result.opportunityScan.map((o: string, i: number) => (
                            <div key={i} className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                               <span className="text-green-500 font-mono font-bold">0{i+1}</span>
                               <p className="text-sm text-gray-200 font-bold">{o}</p>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
             </section>

              {/* XVII-b. Strategic Pivot Suggestions */}
              {result.pivotSuggestions?.pivots && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '3.5s' }}>
                   <h3 className="text-3xl font-black text-yellow-500 flex items-center gap-4">
                      <span className="bg-yellow-500/10 w-10 h-10 flex items-center justify-center rounded-lg border border-yellow-500/30 font-mono text-lg">XVII-b</span>
                      STRATEGIC PIVOT SUGGESTIONS
                   </h3>
                   <div className="grid lg:grid-cols-3 gap-6">
                      {result.pivotSuggestions.pivots.map((p: any, i: number) => (
                        <div key={i} className="glass-card border-yellow-500/30 bg-yellow-500/5 transition-all hover:bg-yellow-500/10">
                           <h4 className="text-lg font-black text-white mb-2 underline decoration-yellow-500/50">{p.name}</h4>
                           <div className="flex items-center gap-2 mb-4">
                              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded">{p.shift}</span>
                           </div>
                           <p className="text-sm text-gray-200 italic mb-6 leading-relaxed">"{p.logic}"</p>
                           <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                              <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Market Opportunity</span>
                              <p className="text-xs text-white font-bold font-mono tracking-tight">{p.opportunity}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
              )}

              {/* XVII-c. INDEPENDENT SECOND OPINION */}
              {rawData.secondOpinion?.result && (
                <section className="space-y-8 animate-slide-up print:break-inside-avoid" style={{ animationDelay: '3.6s' }}>
                   <div className="glass-card border-l-4 border-purple-500 !bg-purple-500/5">
                      <div className="flex justify-between items-start mb-6">
                         <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest flex items-center gap-3">
                            <span className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">⚑</span>
                            INDEPENDENT SECOND OPINION
                         </h3>
                         <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${rawData.secondOpinion.result.dissentLevel === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                           Dissent: {rawData.secondOpinion.result.dissentLevel}
                         </span>
                      </div>
                      <div className="space-y-6">
                         <p className="text-lg text-white font-serif italic border-l-2 border-purple-500/30 pl-4">"{rawData.secondOpinion.result.contrarianTake}"</p>
                         <div className="grid lg:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                               <span className="text-[9px] font-black text-gray-500 uppercase block mb-2">Overlooked Risk</span>
                               <p className="text-sm text-red-300">"{rawData.secondOpinion.result.overlookedRisk}"</p>
                            </div>
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                               <span className="text-[9px] font-black text-gray-500 uppercase block mb-2">Hidden Silver Lining</span>
                               <p className="text-sm text-green-300">"{rawData.secondOpinion.result.hiddenSilverLining}"</p>
                            </div>
                         </div>
                         <div className="p-4 bg-black/40 border border-purple-500/20 rounded-xl mt-4">
                            <span className="text-[10px] text-purple-400 font-black uppercase block mb-2">Final Recalibrated Verdict</span>
                            <p className="text-xl font-black text-white italic">"{rawData.secondOpinion.result.recalibratedVerdict}"</p>
                         </div>
                      </div>
                   </div>
                </section>
              )}

             {/* XVIII. Interactive Stress Test */}
             <section className="glass-card border-purple-500/50 bg-purple-500/5 p-12 animate-slide-up" style={{ animationDelay: '2.2s' }}>
                <div className="max-w-3xl mx-auto text-center">
                   <h3 className="text-3xl font-black text-white mb-4">INTERACTIVE STRESS TEST</h3>
                   <p className="text-gray-400 mb-8 italic text-sm">Challenge the business with a specific market shock or execution failure.</p>
                   
                   <div className="flex gap-4 mb-8">
                      <input 
                         type="text" 
                         className="flex-1 bg-black/40 border-2 border-white/10 rounded-2xl px-6 py-4 text-white focus:border-purple-500 outline-none transition-all font-bold placeholder:opacity-30"
                         placeholder="e.g. 'Apple releases a built-in competitor for free'"
                         value={stressTestInput}
                         onChange={(e) => setStressTestInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && !isStressTesting && stressTestInput && handleStressTest(stressTestInput)}
                      />
                      <button 
                         className={`px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50`}
                         onClick={() => handleStressTest(stressTestInput)}
                         disabled={isStressTesting || !stressTestInput}
                      >
                         {isStressTesting ? 'SIMULATING...' : 'PROBE'}
                      </button>
                   </div>

                   {isStressTesting && (
                      <div className="animate-pulse space-y-4 text-left">
                         <div className="h-4 bg-white/5 rounded w-3/4" />
                         <div className="h-4 bg-white/5 rounded w-1/2" />
                      </div>
                   )}

                   {stressResults.length > 0 && (
                      <div className="animate-slide-up text-left space-y-4">
                         {stressResults.map((sr) => (
                           <div key={sr.id} className="p-8 bg-black/40 rounded-3xl border border-white/10">
                              <div className="flex items-center gap-3 mb-6">
                                 <span className={`px-4 py-1 rounded-full text-xs font-black uppercase ${
                                    sr.verdict === 'Lethal' ? 'bg-red-500/20 text-red-500' : 
                                    sr.verdict === 'Severe' ? 'bg-orange-500/20 text-orange-500' : 'bg-green-500/20 text-green-400'
                                 }`}>{sr.verdict || sr.impact} Impact</span>
                              </div>
                              <p className="text-xl text-white font-bold mb-6 italic leading-relaxed">"{renderSafe(sr.logic || sr.reasoning)}"</p>
                              <div className="grid lg:grid-cols-2 gap-6">
                                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-green-400 font-black uppercase block mb-1">Survival Strategy</span>
                                    <p className="text-xs text-gray-400 leading-tight">{renderSafe(sr.mitigation || sr.survivalStrategy)}</p>
                                 </div>
                                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-yellow-500 font-black uppercase block mb-1">The Pivot Path</span>
                                    <p className="text-xs text-gray-400 leading-tight">{renderSafe(sr.pivotPath)}</p>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
             </section>

             {/* Footer Actions */}
             <div className="flex justify-center gap-6 mt-20 pt-20 border-t border-white/5">
                <button 
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Download PDF Report
                </button>
                <button 
                  onClick={() => {
                     setResult(null);
                     setPhase(-1);
                     setPhaseName('');
                     setActiveTab('dossier');
                     setChallenges(null);
                     setRawData({});
                     setStressResults([]);
                     setFailedPhases([]);
                     setLogs([]);
                     setStressTestInput('');
                     localStorage.removeItem('audit-in-progress'); // Fix 13
                     clearSaved();
                  }}
                  className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Destroy & New Audit
                </button>
             </div>
          </div>
        )}

        {/* SPRINT PLAN VIEW */}
        {result && activeTab === 'sprint' && (
          <SprintPlan idea={idea} auditResult={result} />
        )}

        {/* ASSUMPTION TRACKER VIEW */}
        {result && activeTab === 'assumptions' && (
          <AssumptionTracker idea={idea} auditResult={result} onRescoreComplete={(newResult) => setResult(newResult)} />
        )}

        {/* COMPETITOR WATCH VIEW */}
        {result && activeTab === 'competitors' && (
          <CompetitorWatch idea={idea} rawData={rawData} />
        )}

        {/* BENCHMARKS VIEW */}
        {result && activeTab === 'benchmarks' && (
          <Benchmarks idea={idea} auditResult={result} rawData={rawData} />
        )}

        {/* PITCH DECK VIEW */}
        {result && activeTab === 'pitchdeck' && (
          <PitchDeck idea={idea} auditResult={result} rawData={result} />
        )}

        {/* INVESTOR MATCH VIEW */}
        {result && activeTab === 'investor' && (
          <InvestorMatch idea={idea} auditResult={result} rawData={result} />
        )}

        {/* PIVOT SIMULATOR VIEW */}
        {result && activeTab === 'pivot' && (
          <PivotSimulator idea={idea} auditResult={result} />
        )}
      </div>
    </main>
  );
}
