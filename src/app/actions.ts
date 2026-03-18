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

import { validateFounderFit } from '@/lib/prompts/validateFounderFit';
import { generateRoadmap } from '@/lib/prompts/generateRoadmap';

import { safeJsonParse } from '@/lib/safeJsonParse';

// New: Founder-Market Fit Phase
export async function runFounderFit(idea: any) {
  const ideaStr = JSON.stringify({ name: idea.name, problem: idea.problem, solution: idea.solution, industry: idea.industry });
  const founderData = JSON.stringify({ 
    background: idea.founderBackground, 
    budget: idea.budget, 
    locale: idea.locale,
    targetAudience: idea.targetAudience 
  });
  const raw = await validateFounderFit(ideaStr, founderData);
  return { raw, parsed: safeJsonParse(raw) };
}

// FIX: No more founderDNA stubs — interrogation uses market intelligence only
export async function runInterrogation(idea: any, phaseContext: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await interrogateIdea(ideaStr, phaseContext, [], "None");
  return safeJsonParse(raw);
}

// FIX: Pass Tavily answer to prompts as "Research Summary"
export async function runPhase1Problem(idea: any, initialContext: string) {
  const ideaStr = JSON.stringify(idea);
  const evidence = await verifyProblem(idea.problem, idea.industry);
  const researchInput = evidence.answer
    ? `RESEARCH SUMMARY:\n${evidence.answer}\n\nRAW RESULTS:\n${JSON.stringify(evidence.results)}`
    : JSON.stringify(evidence.results);
  const contextStr = (idea.targetAudience ? `\nTARGET CUSTOMER: ${idea.targetAudience}` : '')
    + (idea.whyNow ? `\nTHE CATALYST (WHY NOW): ${idea.whyNow}` : '')
    + (idea.tractionEvidence ? `\nTRACTION/PROOF: ${idea.tractionEvidence}` : '');
  const raw = await validateProblem(ideaStr + contextStr + "\nCONTEXT: " + initialContext, researchInput);
  return { raw, parsed: safeJsonParse(raw), searchResults: evidence.results };
}

// FIX: Pass competitorsInfo to smarter Tavily search + attach Tavily answer
export async function runPhase2Competitors(idea: any, competitorsInfo: string) {
  const ideaStr = JSON.stringify(idea);
  const compResults = await searchCompetitors(idea.name, idea.industry, competitorsInfo);
  const researchInput = compResults.answer
    ? `RESEARCH SUMMARY:\n${compResults.answer}\n\nRAW RESULTS:\n${JSON.stringify(compResults.results)}`
    : JSON.stringify(compResults.results);
  const raw = await validateCompetitors(ideaStr + "\nUSER COMPETITOR INFO: " + competitorsInfo, researchInput);
  return { raw, parsed: safeJsonParse(raw), searchResults: compResults.results };
}

export async function runPhase3Competition(idea: any, p2Raw: string) {
  const raw = await validateCompetition(JSON.stringify(idea), p2Raw);
  return { raw, parsed: safeJsonParse(raw) };
}

// UPDATED: Feasibility now evaluates based on founder background and budget
export async function runPhase4Feasibility(idea: any) {
  const context = `
    STARTUP STAGE: ${idea.stage}. 
    FOUNDER BACKGROUND: ${idea.founderBackground}. 
    BUDGET: ${idea.budget}. 
    LOCALE: ${idea.locale}.
  `;
  const raw = await validateFeasibility(JSON.stringify(idea), context + "Evaluate if the idea's technical/operational complexity matches the founder's profile and resources.");
  return { raw, parsed: safeJsonParse(raw) };
}

// FIX: Pass monetization input to Market phase
export async function runPhase5Market(idea: any) {
  const pricingResults = await searchPricing(idea.name, idea.industry);
  const researchInput = pricingResults.answer
    ? `RESEARCH SUMMARY:\n${pricingResults.answer}\n\nRAW RESULTS:\n${JSON.stringify(pricingResults.results)}`
    : JSON.stringify(pricingResults.results);
  const ideaWithMonetization = JSON.stringify(idea) 
    + (idea.monetization ? `\nREVENUE MODEL: ${idea.monetization}` : '')
    + (idea.targetPricing ? `\nTARGET PRICING: ${idea.targetPricing}` : '')
    + (idea.acquisitionChannel ? `\nACQUISITION CHANNEL: ${idea.acquisitionChannel}` : '')
    + (idea.targetAudience ? `\nTARGET CUSTOMER: ${idea.targetAudience}` : '')
    + (idea.locale ? `\nLOCALE: ${idea.locale}` : '');
  const raw = await validateMarket(ideaWithMonetization, researchInput);
  return { raw, parsed: safeJsonParse(raw), searchResults: pricingResults.results };
}

export async function runPhase6Differentiation(idea: any, p2Raw: string) {
  const context = idea.acquisitionChannel ? `\nPROPOSED ACQUISITION CHANNEL: ${idea.acquisitionChannel}` : '';
  const raw = await validateDifferentiation(JSON.stringify(idea) + context, p2Raw);
  return { raw, parsed: safeJsonParse(raw) };
}

// FIX: Pre-Mortem — no founderDNA, uses real phase data
export async function runPreMortem(idea: any, phaseResearchSummary: string) {
  const raw = await preMortemSimulation(JSON.stringify(idea), phaseResearchSummary, []);
  return safeJsonParse(raw);
}

export async function runPhase7Failures(idea: any, simResponse: any, context: any) {
  const raw = await validateFailures(JSON.stringify(idea) + "\nRESPONSE: " + JSON.stringify(simResponse), JSON.stringify(context));
  return { raw, parsed: safeJsonParse(raw) };
}

// FIX: finalScoring — structured confidence scores + thinkFast for post-verdict
export async function finalizeAudit(idea: any, answers: any, simResponse: any, context: any, collectedEvidence: any) {
  // Extract confidence scores from each phase for the final scoring prompt
  const phaseConfidences = {
    problemConfidence: context.p1?.parsed?.confidenceScore ?? 'unknown',
    competitorConfidence: context.p2?.parsed?.confidenceScore ?? 'unknown',
    competitionScore: context.p3?.parsed?.competitionScore ?? 'unknown',
    feasibilityConfidence: context.p4?.parsed?.confidenceScore ?? 'unknown',
    marketConfidence: context.p5?.parsed?.confidenceScore ?? 'unknown',
    differentiationConfidence: context.p6?.parsed?.confidenceScore ?? 'unknown',
    founderFitScore: context.p_fit?.parsed?.score ?? 'unknown'
  };

  const stageTag = idea.stage ? `\nSTARTUP STAGE: ${idea.stage}` : '';
  const inputStr = JSON.stringify(idea) 
    + stageTag
    + "\nFOUNDER FIT: " + JSON.stringify(context.p_fit?.parsed)
    + "\nINPUTS: " + JSON.stringify(answers) 
    + "\nPHASE CONFIDENCE SCORES: " + JSON.stringify(phaseConfidences)
    + (idea.whyNow ? `\nWHY NOW: ${idea.whyNow}` : '')
    + (idea.tractionEvidence ? `\nTRACTION: ${idea.tractionEvidence}` : '')
    + (idea.acquisitionChannel ? `\nMARKETING CHANNEL: ${idea.acquisitionChannel}` : '')
    + "\n" + JSON.stringify(simResponse);
  const raw = await finalScoring(inputStr, JSON.stringify(context));
  const parsed = safeJsonParse(raw);

  const avgScore = parsed.compositeScores ? 
    Object.values(parsed.compositeScores as Record<string, number>).reduce((a, b) => a + b, 0) / Object.values(parsed.compositeScores).length
    : 0;

  let extraData: any = {};

  // Roadmap generation (parallel with others)
  const roadmapPromise = generateRoadmap(JSON.stringify(idea), JSON.stringify({ verdict: parsed.verdictLabel, scores: parsed.scores, vulnerabilities: parsed.expertSignals?.red }));

  if (avgScore >= 65) {
    // Coroner + Projections + Blueprint + Roadmap all in parallel
    const [coronerRaw, projectionsRaw, blueprintRaw, roadmapRaw] = await Promise.all([
      coronerReport(JSON.stringify(idea), JSON.stringify(context)),
      generateProjections(JSON.stringify(idea), JSON.stringify(context), avgScore),
      generateBlueprint(JSON.stringify(idea), JSON.stringify(simResponse)),
      roadmapPromise
    ]);
    extraData.coronerReport = safeJsonParse(coronerRaw);
    extraData.projections = safeJsonParse(projectionsRaw);
    extraData.blueprint = safeJsonParse(blueprintRaw);
    extraData.roadmap = safeJsonParse(roadmapRaw);
  } else {
    // Coroner + Pivots + Roadmap in parallel
    const [coronerRaw, pivotRaw, roadmapRaw] = await Promise.all([
      coronerReport(JSON.stringify(idea), JSON.stringify(context)),
      pivotEngine(JSON.stringify(idea), JSON.stringify(simResponse)),
      roadmapPromise
    ]);
    extraData.coronerReport = safeJsonParse(coronerRaw);
    extraData.pivots = safeJsonParse(pivotRaw);
    extraData.roadmap = safeJsonParse(roadmapRaw);
  }

  extraData.evidenceVault = collectedEvidence;

  return { ...parsed, ...extraData };
}

// Stress Test with full audit context
export async function runStressTest(idea: string, change: string, auditSummary: { scores: any; verdict: string; reasoning: string; compositeScores: any }) {
  const systemPrompt = `You are the "Stress Test Engine", an AI explicitly designed to re-evaluate startup metrics based on a user's proposed pivot or change.
You MUST respond with valid JSON matching this exact schema:
{
  "impact": "Positive" | "Negative" | "Neutral",
  "delta": number, // an integer from -30 to +30 representing the percentage point shift in overall winnability
  "logic": "string", // 2-3 sentences explaining WHY this change shifts the score
  "dimensionShifts": [
    { "dimension": "name", "from": current_score, "to": new_score, "reason": "why" }
  ]
}`;

  const userPrompt = `IDEA: "${idea}"
PROPOSED CHANGE: "${change}"

CURRENT AUDIT STATE:
- Verdict: ${auditSummary.verdict}
- Composite Scores: ${JSON.stringify(auditSummary.compositeScores)}
- Reasoning: ${auditSummary.reasoning}
- Dimension Scores: ${JSON.stringify(auditSummary.scores)}

TASK: Evaluate how the proposed change would shift the startup's winnability relative to its CURRENT scores. Be specific about which dimensions improve or degrade. Return ONLY the requested JSON.`;

  const raw = await thinkFast([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { jsonMode: true });
  return safeJsonParse(raw);
}
