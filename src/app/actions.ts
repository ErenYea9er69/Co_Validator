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
  const contextStr = idea.targetAudience ? `\nTARGET CUSTOMER: ${idea.targetAudience}` : '';
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

// FIX: No more founderDNA stub — feasibility evaluates idea complexity alone
export async function runPhase4Feasibility(idea: any) {
  const raw = await validateFeasibility(JSON.stringify(idea), "Evaluate based on idea complexity and industry standards");
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
    + (idea.targetAudience ? `\nTARGET CUSTOMER: ${idea.targetAudience}` : '');
  const raw = await validateMarket(ideaWithMonetization, researchInput);
  return { raw, parsed: safeJsonParse(raw), searchResults: pricingResults.results };
}

export async function runPhase6Differentiation(idea: any, p2Raw: string) {
  const raw = await validateDifferentiation(JSON.stringify(idea), p2Raw);
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

// FIX: finalScoring — no founderDNA parameter
export async function finalizeAudit(idea: any, answers: any, simResponse: any, context: any, collectedEvidence: any) {
  const inputStr = JSON.stringify(idea) + "\nINPUTS: " + JSON.stringify(answers) + "\n" + JSON.stringify(simResponse);
  const raw = await finalScoring(inputStr, JSON.stringify(context));
  const parsed = safeJsonParse(raw);

  const avgScore = parsed.compositeScores ? 
    Object.values(parsed.compositeScores as Record<string, number>).reduce((a, b) => a + b, 0) / Object.values(parsed.compositeScores).length
    : 0;

  let extraData: any = {};

  // Coroner Report ALWAYS runs
  const coronerRaw = await coronerReport(JSON.stringify(idea), JSON.stringify(context));
  extraData.coronerReport = safeJsonParse(coronerRaw);

  if (avgScore >= 65) {
    const [projectionsRaw, blueprintRaw] = await Promise.all([
      generateProjections(JSON.stringify(idea), JSON.stringify(context), avgScore),
      generateBlueprint(JSON.stringify(idea), JSON.stringify(simResponse)),
    ]);
    extraData.projections = safeJsonParse(projectionsRaw);
    extraData.blueprint = safeJsonParse(blueprintRaw);
  } else {
    const pivotRaw = await pivotEngine(JSON.stringify(idea), JSON.stringify(simResponse));
    extraData.pivots = safeJsonParse(pivotRaw);
  }

  extraData.evidenceVault = collectedEvidence;

  return { ...parsed, ...extraData };
}

// Stress Test with full audit context
export async function runStressTest(idea: string, change: string, auditSummary: { scores: any; verdict: string; reasoning: string; compositeScores: any }) {
  const prompt = `You are stress-testing a proposed change to a startup idea.

IDEA: "${idea}"
PROPOSED CHANGE: "${change}"

CURRENT AUDIT STATE:
- Verdict: ${auditSummary.verdict}
- Composite Scores: ${JSON.stringify(auditSummary.compositeScores)}
- Reasoning: ${auditSummary.reasoning}
- Dimension Scores: ${JSON.stringify(auditSummary.scores)}

TASK: Evaluate how the proposed change would shift the startup's winnability relative to its CURRENT scores. Be specific about which dimensions improve or degrade.

Return JSON:
{
  "impact": "Positive" or "Negative",
  "delta": number (-30 to +30, the percentage point shift in overall winnability),
  "logic": "2-3 sentences explaining WHY this change shifts the score, referencing specific dimensions",
  "dimensionShifts": [
    { "dimension": "name", "from": current, "to": projected, "reason": "why" }
  ]
}`;
  const raw = await thinkFast([{ role: 'user', content: prompt }], { jsonMode: true });
  return safeJsonParse(raw);
}
