import { thinkDeep } from './ai';
import { verifyProblem, searchCompetitors, searchPricing } from './tavily';
import { validateProblem } from './prompts/validateProblem';
import { validateCompetitors } from './prompts/validateCompetitors';
import { validateCompetition } from './prompts/validateCompetition';
import { validateFeasibility } from './prompts/validateFeasibility';
import { validateMarket } from './prompts/validateMarket';
import { validateDifferentiation } from './prompts/validateDifferentiation';
import { validateFailures } from './prompts/validateFailures';
import { finalScoring } from './prompts/finalScoring';
import { interrogateIdea } from './prompts/interrogateIdea';
import { preMortemSimulation } from './prompts/preMortemSimulation';
import { retryWithBackoff } from './retryHandler';

export interface ValidationEvent {
  type: string;
  phase?: number;
  name?: string;
  data?: any;
  status?: string;
}

export type EventCallback = (event: ValidationEvent) => void;

function safeJsonParse(text: string, fallback: any = {}): any {
  if (!text) return fallback;
  try {
    let jsonStr = text.replace(/```json\s?|```/g, '').trim();
    const startObj = jsonStr.indexOf('{');
    const startArr = jsonStr.indexOf('[');
    let start = -1;
    let end = -1;
    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      start = startObj;
      end = jsonStr.lastIndexOf('}');
    } else if (startArr !== -1) {
      start = startArr;
      end = jsonStr.lastIndexOf(']');
    }
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = jsonStr.substring(start, end + 1);
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    return fallback;
  }
}

export async function runDeepValidation(
  idea: { name: string, problem: string, solution: string, industry: string },
  founderDNA: any,
  onEvent: EventCallback,
  waitForInput: (type: 'interrogation' | 'pre-mortem', data: any) => Promise<any>
): Promise<any> {
  const ideaStr = JSON.stringify(idea);
  const founderStr = JSON.stringify(founderDNA);
  const emit = (event: ValidationEvent) => onEvent(event);

  // ═══ INTERROGATION PHASE ═══
  emit({ type: 'phase_start', phase: 0, name: 'Interrogation' });
  const interrogationRaw = await interrogateIdea(ideaStr, "Standalone Context", [], "None");
  const interrogation = safeJsonParse(interrogationRaw);
  const interrogationAnswers = await waitForInput('interrogation', interrogation);
  const answersStr = JSON.stringify(interrogationAnswers);

  const runPhase = async (name: string, phase: number, fn: () => Promise<string>) => {
    emit({ type: 'phase_start', phase, name });
    const raw = await retryWithBackoff(async () => {
       const res = await fn();
       const parsed = safeJsonParse(res);
       emit({ type: 'phase_complete', phase, name, data: parsed });
       return { raw: res, parsed };
    }, 2);
    return raw;
  };

  // 1. Problem Reality
  const p1 = await runPhase('Problem Reality', 1, async () => {
    const evidence = await verifyProblem(idea.problem, idea.industry);
    return await validateProblem(ideaStr + "\nANSWERS: " + answersStr, JSON.stringify(evidence.results));
  });

  // 2. Competitors
  const p2 = await runPhase('Competitor Investigation', 2, async () => {
    const compResults = await searchCompetitors(idea.name, idea.industry);
    return await validateCompetitors(ideaStr + "\nANSWERS: " + answersStr, JSON.stringify(compResults.results));
  });

  // 3. Competition Saturation
  const p3 = await runPhase('Competition Saturation', 3, () => validateCompetition(ideaStr, p2.raw));

  // 4. Build Feasibility
  const p4 = await runPhase('Build Feasibility', 4, () => validateFeasibility(ideaStr, "Evaluate based on idea complexity"));

  // 5. Market & Monetization
  const p5 = await runPhase('Market & Monetization', 5, async () => {
    const pricingResults = await searchPricing(idea.name, idea.industry);
    return await validateMarket(ideaStr, JSON.stringify(pricingResults.results));
  });

  // 6. Differentiation
  const p6 = await runPhase('Differentiation', 6, () => validateDifferentiation(ideaStr, p2.raw));

  // ═══ PRE-MORTEM SIMULATION ═══
  emit({ type: 'phase_start', phase: 6.5, name: 'Pre-Mortem Simulation' });
  const phaseContext = JSON.stringify({ p1: p1.parsed, p2: p2.parsed, p3: p3.parsed, p4: p4.parsed, p5: p5.parsed, p6: p6.parsed });
  const simulationRaw = await preMortemSimulation(ideaStr, phaseContext, []);
  const simulation = safeJsonParse(simulationRaw);
  const simulationResponse = await waitForInput('pre-mortem', simulation);
  const simStr = JSON.stringify(simulationResponse);

  // 7. Failure Scenarios
  const p7 = await runPhase('Failure Scenarios', 7, () => validateFailures(ideaStr + "\nRESPONSE: " + simStr, JSON.stringify({ p1, p2, p3, p4, p5, p6 })));

  // 8. Final Scoring
  const p8 = await runPhase('Final Scoring', 8, () => finalScoring(ideaStr + "\nINPUTS: " + answersStr + "\n" + simStr, JSON.stringify({ p1, p2, p3, p4, p5, p6, p7 })));

  const result = p8.parsed;
  result.fullValidation = { 
    phase1: p1.parsed, phase2: p2.parsed, phase3: p3.parsed, 
    phase4: p4.parsed, phase5: p5.parsed, phase6: p6.parsed, phase7: p7.parsed 
  };

  return result;
}
