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
import { inputInterrogation } from '@/lib/prompts/inputInterrogation';
import { syntheticResearch } from '@/lib/prompts/syntheticResearch';
import { regulatoryAnalysis } from '@/lib/prompts/regulatoryAnalysis';
import { financialAnalysis } from '@/lib/prompts/financialAnalysis';
import { runDebate } from '@/lib/prompts/debateEngine';
import { competitiveResponse } from '@/lib/prompts/competitiveResponse';
import { apathySimulator } from '@/lib/prompts/apathySimulator';

import { safeJsonParse } from '@/lib/safeJsonParse';


// New: Founder-Market Fit Phase
export async function runFounderFit(idea: any) {
  const ideaStr = JSON.stringify({ name: idea.name, problem: idea.problem, solution: idea.solution, industry: idea.industry });
  const founderData = JSON.stringify({ 
    background: idea.founderBackground, 
    linkedin: idea.linkedinUrls,
    coFounders: idea.coFounders,
    budget: idea.budget, 
    locale: idea.locale,
    targetAudience: idea.targetAudience 
  });

  const raw = await validateFounderFit(ideaStr, founderData);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runInterrogation(idea: any, phaseContext: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await interrogateIdea(ideaStr, phaseContext, [], "None");
  return safeJsonParse(raw);
}

export async function runPhase7Roadmap(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await generateRoadmap(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase9Regulatory(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await regulatoryAnalysis(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runPhase10Financial(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await financialAnalysis(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runDebateEngine(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await runDebate(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}


export async function runInputInterrogation(idea: any) {
  const ideaStr = JSON.stringify(idea);
  const raw = await inputInterrogation(ideaStr);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runSyntheticResearch(idea: any) {
  const queries = [
    `${idea.industry} ${idea.problem} reddit`,
    `${idea.industry} ${idea.problem} site:g2.com reviews`,
    `${idea.name} ${idea.industry} indiehackers`
  ];
  const researchResults = await (require('@/lib/tavily').searchSyntheticPrimary)(queries);
  const rawResearch = JSON.stringify(researchResults.results);
  const raw = await syntheticResearch(JSON.stringify(idea), rawResearch);
  return { raw, parsed: safeJsonParse(raw), searchResults: researchResults.results };
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
    + (idea.tractionEvidence ? `\nTRACTION EVIDENCE: ${idea.tractionEvidence}` : '')
    + (idea.tractionDocs ? `\nTRACTION ARTIFACTS/DOCS: ${idea.tractionDocs}` : '');
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

export async function runCompetitiveResponse(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await competitiveResponse(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}

export async function runApathySimulation(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await apathySimulator(ideaStr, researchSummary);
  return { raw, parsed: safeJsonParse(raw) };
}

// Refactored finalizeAudit — No more score-based branching
export async function finalizeAudit(idea: any, answers: any, simResponse: any, context: any, collectedEvidence: any) {
  const stageTag = idea.stage ? `\nSTARTUP STAGE: ${idea.stage}` : '';
  const inputStr = JSON.stringify(idea) 
    + stageTag
    + "\nFOUNDER FIT: " + JSON.stringify(context.p_fit?.parsed)
    + "\nINPUTS: " + JSON.stringify(answers) 
    + "\nSIMULATION: " + JSON.stringify(simResponse)
    + "\nDEBATE: " + JSON.stringify(context.debate?.parsed)
    + "\nCOMPETITIVE RESPONSE: " + JSON.stringify(context.competitiveResponse?.parsed)
    + "\nAPATHY SIMULATION: " + JSON.stringify(context.apathy?.parsed);

  const raw = await finalScoring(inputStr, JSON.stringify(context));
  const parsed = safeJsonParse(raw);

  let extraData: any = {};

  const [projectionsRaw, blueprintRaw, roadmapRaw, pivotRaw] = await Promise.all([
    generateProjections(JSON.stringify(idea), JSON.stringify(context), 50), // Now 6-month in prompt
    generateBlueprint(JSON.stringify(idea), JSON.stringify(simResponse)),
    generateRoadmap(JSON.stringify(idea), JSON.stringify({ verdict: parsed.coreBet, vulnerabilities: parsed.vulnerabilityScan })),
    pivotEngine(JSON.stringify(idea), JSON.stringify(simResponse))
  ]);

  extraData.projections = safeJsonParse(projectionsRaw);
  extraData.blueprint = safeJsonParse(blueprintRaw);
  extraData.roadmap = safeJsonParse(roadmapRaw);
  extraData.pivots = safeJsonParse(pivotRaw);
  extraData.evidenceVault = collectedEvidence;

  return { ...parsed, ...extraData };
}



// Stress Test refactored for qualitative analysis
export async function runStressTest(idea: string, change: string, auditSummary: { assumptions: any; reasoning: string }) {
  const systemPrompt = `You are the "Strategic Stress Test Engine". 
Evaluate how a proposed pivot or change affects the startup's "Critical Assumption Stack".
Identify which assumptions are resolved, which are created, and how the overall risk profile shifts.

You MUST respond with valid JSON:
{
  "impact": "Positive" | "Negative" | "Neutral",
  "shiftReasoning": "string",
  "assumptionDeltas": [
    { "assumption": "name", "originalRisk": "string", "newRisk": "string", "logic": "why" }
  ]
}`;

  const userPrompt = `IDEA: "${idea}"
PROPOSED CHANGE: "${change}"

CURRENT STRATEGIC STATE:
${JSON.stringify(auditSummary.assumptions)}
- Reasoning: ${auditSummary.reasoning}

TASK: Evaluate how the proposed change shifts the survival risk and the assumption stack. Return ONLY the requested JSON.`;

  const raw = await thinkFast([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { jsonMode: true });
  return safeJsonParse(raw);
}

