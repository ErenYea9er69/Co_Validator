'use server';

import { thinkDeep, thinkFast } from '@/lib/ai';
import { verifyProblem, searchCompetitors, searchPricing } from '@/lib/tavily';
import { validateProblem } from '@/lib/prompts/validateProblem';
import { validateCompetitors } from '@/lib/prompts/validateCompetitors';
import { validateCompetition } from '@/lib/prompts/validateCompetition';
import { validateFeasibility } from '@/lib/prompts/validateFeasibility';
import { validateMarket } from '@/lib/prompts/validateMarket';
import { validateDifferentiation } from '@/lib/prompts/validateDifferentiation';
import { validateFailures } from '@/lib/prompts/validateFailures';
import { finalScoring } from '@/lib/prompts/finalScoring';
import { interrogateIdea } from '@/lib/prompts/interrogateIdea';
import { preMortemSimulation } from '@/lib/prompts/preMortemSimulation';
import { generateProjections } from '@/lib/prompts/generateProjections';
import { generateBlueprint } from '@/lib/prompts/generateBlueprint';
import { pivotEngine } from '@/lib/prompts/pivotEngine';
import { coronerReport } from '@/lib/prompts/coronerReport';
import { founderFit } from '@/lib/prompts/founderFit';
import { retryWithBackoff } from '@/lib/retryHandler';

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

export async function runInterrogation(idea: any, founderDNA: any) {
  const ideaStr = JSON.stringify(idea);
  const raw = await interrogateIdea(ideaStr, founderDNA, "Standalone Context", [], "None");
  return safeJsonParse(raw);
}

export async function runPhase1Problem(idea: any, initialContext: string) {
  const ideaStr = JSON.stringify(idea);
  const evidence = await verifyProblem(idea.problem, idea.industry);
  const raw = await validateProblem(ideaStr + "\nCONTEXT: " + initialContext, JSON.stringify(evidence.results));
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase2Competitors(idea: any, competitorsInfo: string) {
  const ideaStr = JSON.stringify(idea);
  const compResults = await searchCompetitors(idea.name, idea.industry);
  const raw = await validateCompetitors(ideaStr + "\nUSER COMPETITOR INFO: " + competitorsInfo, JSON.stringify(compResults.results));
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase3Competition(idea: any, p2Raw: string) {
  const raw = await validateCompetition(JSON.stringify(idea), p2Raw);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase4Feasibility(idea: any, founderDNA: any) {
  const raw = await validateFeasibility(JSON.stringify(idea), JSON.stringify(founderDNA));
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase5Market(idea: any) {
  const pricingResults = await searchPricing(idea.name, idea.industry);
  const raw = await validateMarket(JSON.stringify(idea), JSON.stringify(pricingResults.results));
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase6Differentiation(idea: any, p2Raw: string) {
  const raw = await validateDifferentiation(JSON.stringify(idea), p2Raw);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPreMortem(idea: any, founderDNA: any) {
  const raw = await preMortemSimulation(JSON.stringify(idea), "Deep Context", founderDNA, []);
  return safeJsonParse(raw);
}

export async function runPhase7Failures(idea: any, simResponse: any, context: any) {
  const raw = await validateFailures(JSON.stringify(idea) + "\nRESPONSE: " + JSON.stringify(simResponse), JSON.stringify(context));
  return { raw, parsed: safeJsonParse(raw) };
}

export async function finalizeAudit(idea: any, answers: any, simResponse: any, context: any, founderDNA: any) {
  const inputStr = JSON.stringify(idea) + "\nINPUTS: " + JSON.stringify(answers) + "\n" + JSON.stringify(simResponse);
  const raw = await finalScoring(inputStr, JSON.stringify(context), founderDNA);
  const parsed = safeJsonParse(raw);

  // 10X Upgrades: Conditional Generation
  // We use a simple score threshold (e.g., Composite Score average > 70 or similar)
  // or a qualitative check on the verdict emoji.
  const avgScore = parsed.compositeScores ? 
    Object.values(parsed.compositeScores as Record<string, number>).reduce((a, b) => a + b, 0) / Object.values(parsed.compositeScores).length
    : 0;

  let extraData: any = {};
  if (avgScore >= 65) {
    // Idea is "Worth It" -> Generate Projections, Blueprint, Coroner, and Founder Fit
    const [projectionsRaw, blueprintRaw, coronerRaw, founderRaw] = await Promise.all([
      generateProjections(JSON.stringify(idea), JSON.stringify(context), avgScore),
      generateBlueprint(JSON.stringify(idea), JSON.stringify(simResponse)),
      coronerReport(JSON.stringify(idea), JSON.stringify(context)),
      founderFit(JSON.stringify(idea), founderDNA)
    ]);
    extraData.projections = safeJsonParse(projectionsRaw);
    extraData.blueprint = safeJsonParse(blueprintRaw);
    extraData.coronerReport = safeJsonParse(coronerRaw);
    extraData.founderAlignment = safeJsonParse(founderRaw);
  } else {
    // Idea is "Needs Pivot" -> Generate Pivots
    const pivotRaw = await pivotEngine(JSON.stringify(idea), JSON.stringify(simResponse));
    extraData.pivots = safeJsonParse(pivotRaw);
  }

  // Pass raw research context for the "Evidence Vault"
  extraData.evidenceVault = context;

  return { ...parsed, ...extraData };
}

export async function runStressTest(idea: string, change: string, currentContext: any) {
  const prompt = `Perform a high-velocity stress test on this pivot/change: "${change}" for the idea "${idea}". How does it change the winnability? Return JSON { "impact": "Positive/Negative", "delta": number, "logic": "reasoning" }`;
  const raw = await thinkFast([{ role: 'user', content: prompt }], { jsonMode: true });
  return safeJsonParse(raw);
}
