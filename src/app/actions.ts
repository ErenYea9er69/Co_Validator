'use server';

import { think } from '@/lib/ai';
import { verifyProblem, searchCompetitors, searchPricing, searchSyntheticPrimary, type SearchResult } from '@/lib/tavily';
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

function checkAuth() {
  if (process.env.AUDIT_SECRET && process.env.NODE_ENV === 'production') {
    return true;
  }
}



// New: Founder-Market Fit Phase
export async function runFounderFit(idea: any) {
  const ideaStr = `Name: ${idea.name}\nProblem: ${idea.problem}\nSolution: ${idea.solution}`;
  const founderData = `Experience: ${idea.founderBackground}\nCo-Founders: ${idea.coFounders}\nBudget: ${idea.budget}`;
  
  const result = await validateFounderFit(ideaStr, founderData);
  return { result, usage: {} }; 
}

export async function runInterrogation(idea: any, phaseContext: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await interrogateIdea(ideaStr, phaseContext, [], "None");
  return safeJsonParse(raw);
}

export async function runPhase7Roadmap(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await generateRoadmap(ideaStr, researchSummary);
  return { raw, result: safeJsonParse(raw) };
}

export async function runPhase9Regulatory(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await regulatoryAnalysis(ideaStr, researchSummary);
  return { raw, result: safeJsonParse(raw) };
}

export async function runPhase10Financial(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await financialAnalysis(ideaStr, researchSummary);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function runDebateEngine(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await runDebate(ideaStr, researchSummary);
  return { result: safeJsonParse(raw), raw, usage: {} };
}


export async function runInputInterrogation(idea: any) {
  const ideaStr = JSON.stringify(idea);
  const raw = await inputInterrogation(ideaStr);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function runSyntheticResearch(idea: any) {
  const queries = [
    `${idea.industry} ${idea.targetAudience} pain points reddit`,
    `${idea.name} ${idea.category} competitors ${idea.locale}`,
    `${idea.solution.substring(0, 50)} customer acquisition cost ${idea.acquisitionChannel}`
  ];
  
  const searchResults = await searchSyntheticPrimary(queries);
  const summary = searchResults.results.map(r => `[${r.title}](${r.url}): ${r.content}`).join('\n\n');
  
  const result = await syntheticResearch(JSON.stringify(idea), summary);
  return { result: safeJsonParse(result), summary, usage: {}, tavilyCredits: queries.length * 2, searchResults: searchResults.results };
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
  return { result: safeJsonParse(raw), raw, searchResults: evidence.results, usage: {} };
}

// FIX: Pass competitorsInfo to smarter Tavily search + attach Tavily answer
export async function runPhase2Competitors(idea: any, competitorsInfo: string) {
  const ideaStr = JSON.stringify(idea);
  const compResults = await searchCompetitors(idea.name, idea.industry, competitorsInfo);
  const researchInput = compResults.answer
    ? `RESEARCH SUMMARY:\n${compResults.answer}\n\nRAW RESULTS:\n${JSON.stringify(compResults.results)}`
    : JSON.stringify(compResults.results);
  const raw = await validateCompetitors(ideaStr + "\nUSER COMPETITOR INFO: " + competitorsInfo, researchInput);
  return { result: safeJsonParse(raw), raw, searchResults: compResults.results, usage: {} };
}

export async function runPhase3Competition(idea: any, p2Raw: string) {
  const raw = await validateCompetition(JSON.stringify(idea), p2Raw);
  return { result: safeJsonParse(raw), raw, usage: {} };
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
  return { result: safeJsonParse(raw), raw, usage: {} };
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
  return { result: safeJsonParse(raw), raw, searchResults: pricingResults.results, usage: {} };
}

export async function runPhase6Differentiation(idea: any, p2Raw: string) {
  const context = idea.acquisitionChannel ? `\nPROPOSED ACQUISITION CHANNEL: ${idea.acquisitionChannel}` : '';
  const raw = await validateDifferentiation(JSON.stringify(idea) + context, p2Raw);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

// FIX: Pre-Mortem — no founderDNA, uses real phase data
export async function runPreMortem(idea: any, phaseResearchSummary: string) {
  const raw = await preMortemSimulation(JSON.stringify(idea), phaseResearchSummary, []);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function runPhase7Failures(idea: any, simResponse: any, context: any) {
  const raw = await validateFailures(JSON.stringify(idea) + "\nRESPONSE: " + JSON.stringify(simResponse), JSON.stringify(context));
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function runCompetitiveResponse(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await competitiveResponse(ideaStr, researchSummary);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function runApathySimulation(idea: any, researchSummary: string) {
  const ideaStr = JSON.stringify(idea);
  const raw = await apathySimulator(ideaStr, researchSummary);
  return { result: safeJsonParse(raw), raw, usage: {} };
}

export async function finalizeAudit(idea: any, researchContext: string, interrogationAnswers: any[]) {
  const ideaStr = JSON.stringify({ ...idea, interrogationAnswers });
  const raw = await finalScoring(ideaStr, researchContext);
  const parsed = safeJsonParse(raw, {}, 'Final Scoring');
  
  let pivotRaw = null;
  if (parsed.verdict === 'Indicted' || parsed.verdict === 'Pivot Required') {
    pivotRaw = await pivotEngine(ideaStr, raw);
  }

  return { 
    raw, 
    result: parsed, 
    pivotRaw,
    usage: {},
    tavilyCredits: 0 
  };
}

// Stress Test refactored for qualitative analysis
export async function runStressTest(idea: any, change: string, auditSummary: { assumptions: any; reasoning: string }) {
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

  const userPrompt = `IDEA: "${JSON.stringify(idea)}"
PROPOSED CHANGE: "${change}"

CURRENT STRATEGIC STATE:
${JSON.stringify(auditSummary.assumptions)}
- Reasoning: ${auditSummary.reasoning}

TASK: Evaluate how the proposed change shifts the survival risk and the assumption stack. Return ONLY the requested JSON.`;

  const result = await think([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ], { jsonMode: true });
  return { result: safeJsonParse(result.content), usage: result.usage };
}
