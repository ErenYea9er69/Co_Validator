'use server';

import { think } from '@/lib/ai';
import { search, verifyProblem, searchCompetitors, searchPricing, searchSyntheticPrimary } from '@/lib/tavily';
import { validateProblem } from '@/lib/prompts/validateProblem';
import { validateCompetitors } from '@/lib/prompts/validateCompetitors';
import { validateCompetition } from '@/lib/prompts/validateCompetition';
import { validateFeasibility } from '@/lib/prompts/validateFeasibility';
import { validateMarket } from '@/lib/prompts/validateMarket';
import { validateDifferentiation } from '@/lib/prompts/validateDifferentiation';
import { validateFailures } from '@/lib/prompts/validateFailures';
import { interrogateIdea } from '@/lib/prompts/interrogateIdea';
import { preMortemSimulation } from '@/lib/prompts/preMortemSimulation';
import { finalizeAuditPrompt } from '@/lib/prompts/finalScoring';
import { validateFounderFit } from '@/lib/prompts/validateFounderFit';
import { generateRoadmap } from '@/lib/prompts/generateRoadmap';
import { inputInterrogation } from '@/lib/prompts/inputInterrogation';
import { syntheticResearch } from '@/lib/prompts/syntheticResearch';
import { regulatoryAnalysis } from '@/lib/prompts/regulatoryAnalysis';
import { financialAnalysis } from '@/lib/prompts/financialAnalysis';
import { runDebate } from '@/lib/prompts/debateEngine';
import { competitiveResponse } from '@/lib/prompts/competitiveResponse';
import { apathySimulator } from '@/lib/prompts/apathySimulator';
import { generateSprintPlan } from '@/lib/prompts/generateSprintPlan';
import { rescoreWithEvidence } from '@/lib/prompts/rescoreAudit';
import { generateCompetitorDiff } from '@/lib/prompts/generateCompetitorDiff';
import { generatePitchDeck } from '@/lib/prompts/generatePitchDeck';
import { rewritePitchSlide } from '@/lib/prompts/rewriteSlide';
import { generateInvestorMatch } from '@/lib/prompts/generateInvestorMatch';
import { gradeTaskOutcome as gradeTaskPrompt } from '@/lib/prompts/gradeTask';
import { pivotEngine } from '@/lib/prompts/pivotEngine';
import { suggestPivots } from '@/lib/prompts/suggestPivots';
import { stressTestSimulation as stressTestSimulationPrompt } from '@/lib/prompts/stressTest';
import { suggestNextEvidence } from '@/lib/prompts/suggestEvidence';
import { generateMetricAction } from '@/lib/prompts/generateMetricAction';
import { gradePitchAnswer as gradePitchAnswerPrompt } from '@/lib/prompts/gradePitchAnswer';
import { trendRadar } from '@/lib/prompts/trendRadar';
import { founderBiasCalibrator } from '@/lib/prompts/founderBias';
import { extractClaims, factCheckClaims } from '@/lib/prompts/factCheck';
import { consistencyAuditor } from '@/lib/prompts/consistencyCheck';
import { unitEconomicsVerifier } from '@/lib/prompts/unitEconVerifier';
import { survivorshipBiasDetector } from '@/lib/prompts/survivorshipBias';
import { secondOpinionReview } from '@/lib/prompts/secondOpinion';
import { safeJsonParse } from '@/lib/safeJsonParse';

function checkAuth(token?: string) {
  const secret = process.env.AUDIT_SECRET;
  if (!secret) return; 
  if (process.env.NODE_ENV === 'production') {
    if (!token || token !== secret) {
      throw new Error('Unauthorized Audit Session');
    }
  }
}

export async function runFounderFit(idea: any, token?: string) {
  checkAuth(token);
  const ideaStr = `Name: ${idea.name}\nProblem: ${idea.problem}\nSolution: ${idea.solution}`;
  const founderData = `Experience: ${idea.founderBackground}\nCo-Founders: ${idea.coFounders}\nBudget: ${idea.budget}`;
  const result = await validateFounderFit(ideaStr, founderData);
  return { result: safeJsonParse(result, {}, 'Founder Fit'), usage: {} }; 
}

export async function runInterrogation(idea: any, phaseContext: string, token?: string) {
  checkAuth(token);
  const ideaStr = JSON.stringify(idea);
  const raw = await interrogateIdea(ideaStr, phaseContext, [], "None");
  return safeJsonParse(raw, {}, 'Interrogation');
}

export async function runInputInterrogation(idea: any, token?: string) {
  checkAuth(token);
  const ideaStr = JSON.stringify(idea);
  const raw = await inputInterrogation(ideaStr);
  return { result: safeJsonParse(raw, {}, 'Input Interrogation'), raw, usage: {} };
}

export async function runSyntheticResearch(idea: any, token?: string) {
  checkAuth(token);
  const painCore = idea.problem.split(/[.!?]/)[0].substring(0, 100); 
  const queries = [
    `${idea.industry} ${idea.targetAudience} pain points reddit`,
    `${idea.name} ${idea.industry} competitors ${idea.locale}`,
    `${painCore} customer acquisition cost ${idea.acquisitionChannel || 'general marketing'}`
  ];
  const searchResults = await searchSyntheticPrimary(queries);
  const summary = searchResults.results.map(r => `[${r.title}](${r.url}): ${r.content}`).join('\n\n');
  const result = await syntheticResearch(JSON.stringify(idea), summary);
  return { result: safeJsonParse(result, {}, 'Synthetic Research'), summary, searchResults: searchResults.results };
}

export async function runPhase1Problem(idea: any, initialContext: string, token?: string) {
  checkAuth(token);
  const evidence = await verifyProblem(idea.problem, idea.industry);
  const researchInput = evidence.answer ? `SUMMARY: ${evidence.answer}\nRAW: ${JSON.stringify(evidence.results)}` : JSON.stringify(evidence.results);
  const raw = await validateProblem(JSON.stringify(idea) + "\nCONTEXT: " + initialContext, researchInput);
  return { result: safeJsonParse(raw, {}, 'Problem'), raw, searchResults: evidence.results };
}

export async function runPhase2Competitors(idea: any, competitorsInfo: string, token?: string) {
  checkAuth(token);
  const compResults = await searchCompetitors(idea.name, idea.industry, competitorsInfo);
  const researchInput = compResults.answer ? `SUMMARY: ${compResults.answer}\nRAW: ${JSON.stringify(compResults.results)}` : JSON.stringify(compResults.results);
  const raw = await validateCompetitors(JSON.stringify(idea) + "\nUSER INFO: " + competitorsInfo, researchInput);
  return { result: safeJsonParse(raw, {}, 'Competitors'), raw, searchResults: compResults.results };
}

export async function runPhase3Competition(idea: any, p2Raw: string, token?: string) {
  checkAuth(token);
  const raw = await validateCompetition(JSON.stringify(idea), p2Raw);
  return { result: safeJsonParse(raw, {}, 'Saturation'), raw };
}

export async function runPhase4Feasibility(idea: any, token?: string) {
  checkAuth(token);
  const context = `STAGE: ${idea.stage}. FOUNDER: ${idea.founderBackground}. BUDGET: ${idea.budget}. LOCALE: ${idea.locale}.`;
  const raw = await validateFeasibility(JSON.stringify(idea), context);
  return { result: safeJsonParse(raw), raw };
}

export async function runPhase5Market(idea: any, token?: string) {
  checkAuth(token);
  const pricingResults = await searchPricing(idea.name, idea.industry);
  const researchInput = pricingResults.answer ? `SUMMARY: ${pricingResults.answer}\nRAW: ${JSON.stringify(pricingResults.results)}` : JSON.stringify(pricingResults.results);
  const raw = await validateMarket(JSON.stringify(idea), researchInput);
  return { result: safeJsonParse(raw, {}, 'Market'), raw, searchResults: pricingResults.results };
}

export async function runPhase6Differentiation(idea: any, p2Raw: string, token?: string) {
  checkAuth(token);
  const raw = await validateDifferentiation(JSON.stringify(idea), p2Raw);
  return { result: safeJsonParse(raw, {}, 'Differentiation'), raw };
}

export async function runPhase7Roadmap(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await generateRoadmap(JSON.stringify(idea), researchSummary);
  return { raw, result: safeJsonParse(raw, {}, 'Roadmap') };
}

export async function runPhase9Regulatory(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await regulatoryAnalysis(JSON.stringify(idea), researchSummary);
  return { raw, result: safeJsonParse(raw, {}, 'Regulatory') };
}

export async function runPhase10Financial(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await financialAnalysis(JSON.stringify(idea), researchSummary);
  return { result: safeJsonParse(raw, {}, 'Financial'), raw };
}

export async function runPreMortem(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await preMortemSimulation(JSON.stringify(idea), researchSummary, []);
  return { result: safeJsonParse(raw, {}, 'Pre-Mortem'), raw };
}

export async function runPhase7Failures(idea: any, simResponse: any, context: any, token?: string) {
  checkAuth(token);
  const raw = await validateFailures(JSON.stringify(idea) + "\nSIM: " + JSON.stringify(simResponse), JSON.stringify(context));
  return { result: safeJsonParse(raw, {}, 'Expert Stress Test'), raw };
}

export async function runDebateEngine(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await runDebate(JSON.stringify(idea), researchSummary);
  return { result: safeJsonParse(raw, {}, 'Debate'), raw };
}

export async function runCompetitiveResponse(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await competitiveResponse(JSON.stringify(idea), researchSummary);
  return { result: safeJsonParse(raw, {}, 'Competitive Response'), raw };
}

export async function runApathySimulation(idea: any, researchSummary: string, token?: string) {
  checkAuth(token);
  const raw = await apathySimulator(JSON.stringify(idea), researchSummary);
  return { result: safeJsonParse(raw, {}, 'Apathy'), raw };
}

export async function finalizeAudit(idea: any, researchContext: string, interrogationAnswers: any[], token?: string) {
  checkAuth(token);
  const ideaStr = JSON.stringify({ ...idea, interrogationAnswers });
  const raw = await finalizeAuditPrompt(ideaStr, researchContext);
  const parsed = safeJsonParse(raw, {}, 'Final Scoring');
  let pivotRaw = null;
  if (parsed.verdict === 'Indicted' || parsed.verdict === 'Pivot Required') {
    pivotRaw = await pivotEngine(ideaStr, raw, token);
  }
  return { raw, result: parsed, pivotRaw };
}

export async function runStressTest(idea: any, change: string, auditSummary: { assumptions: any; reasoning: string }, token?: string) {
  checkAuth(token);
  const raw = await stressTestSimulationPrompt(JSON.stringify(idea), change, JSON.stringify(auditSummary));
  return { result: safeJsonParse(raw), usage: {} };
}

export async function runSprintPlan(idea: any, auditResult: any, previousWeekSummary?: string, rawData?: any, token?: string) {
  checkAuth(token);
  const raw = await generateSprintPlan(idea, auditResult, rawData, previousWeekSummary);
  return { result: safeJsonParse(raw, {}, 'Sprint Plan'), raw };
}

export async function gradeSprintTask(taskTitle: string, gradingCriteria: string, founderOutcome: string, token?: string) {
  checkAuth(token);
  const raw = await gradeTaskPrompt(taskTitle, gradingCriteria, founderOutcome);
  return { result: safeJsonParse(raw, {}, 'Task Grader'), raw };
}

export async function rescoreAudit(idea: any, originalAudit: any, evidenceLog: any[], token?: string) {
  checkAuth(token);
  const raw = await rescoreWithEvidence(JSON.stringify(idea), JSON.stringify(originalAudit), JSON.stringify(evidenceLog));
  return { result: safeJsonParse(raw, {}, 'Rescore Audit'), raw };
}

export async function getEvidenceSuggestion(assumptionGroup: any, recentEvidence: any[], token?: string) {
  checkAuth(token);
  const raw = await suggestNextEvidence(assumptionGroup, recentEvidence);
  return { result: safeJsonParse(raw, {}, 'Suggest Evidence'), raw };
}

export async function getMetricActionAdvice(metricTitle: string, userScore: number, reasoning: string, industry: string, token?: string) {
  checkAuth(token);
  const raw = await generateMetricAction(metricTitle, userScore, reasoning, industry);
  return { result: safeJsonParse(raw, {}, 'Metric Action'), raw };
}

export async function refreshCompetitorIntel(competitorName: string, competitorDescription: string, token?: string) {
  checkAuth(token);
  
  // 1. Search for recent news and updates about the competitor
  const searchQuery = `${competitorName} ${competitorDescription} startup product updates pricing funding`;
  const recentNewsRaw = await search(searchQuery, {
    searchDepth: 'advanced', // Need deep search
    maxResults: 5,
    topic: 'news',
    timeRange: 'month' // Limit to recent
  });

  // 2. Synthesize with AI
  const raw = await generateCompetitorDiff(competitorName, JSON.stringify(recentNewsRaw));
  return { result: safeJsonParse(raw, {}, 'Competitor Intel'), raw };
}

export async function createPitchDeck(idea: any, auditResult: any, rawData?: any, token?: string) {
  checkAuth(token);
  const raw = await generatePitchDeck(idea, auditResult, rawData);
  return { result: safeJsonParse(raw, {}, 'Pitch Deck'), raw };
}

export async function rewriteSingleSlide(ideaContext: string, currentSlide: any, founderFeedback: string, token?: string) {
  checkAuth(token);
  const raw = await rewritePitchSlide(ideaContext, currentSlide, founderFeedback);
  return { result: safeJsonParse(raw, {}, 'Rewrite Slide'), raw };
}

export async function stressTestSimulation(ideaStr: string, changeStr: string, auditSummaryStr: string, token?: string) {
  checkAuth(token);
  const raw = await stressTestSimulationPrompt(ideaStr, changeStr, auditSummaryStr);
  return { result: safeJsonParse(raw, {}, 'Stress Test'), raw };
}

export async function matchInvestors(idea: any, auditResult: any, rawData?: any, token?: string) {
  checkAuth(token);
  const raw = await generateInvestorMatch(idea, auditResult, rawData);
  return { result: safeJsonParse(raw, {}, 'Investor Match'), raw };
}

export async function getSuggestedPivots(ideaStr: string, auditSummaryStr: string, token?: string) {
  checkAuth(token);
  const raw = await suggestPivots(ideaStr, auditSummaryStr);
  return { result: safeJsonParse(raw, {}, 'Suggest Pivots'), raw };
}

export async function gradeFounderAnswer(question: string, founderAnswer: string, token?: string) {
  checkAuth(token);
  const raw = await gradePitchAnswerPrompt(question, founderAnswer);
  return { result: safeJsonParse(raw, {}, 'Grade Answer'), raw };
}

export async function runTrendRadar(industry: string, token?: string) {
  checkAuth(token);
  // Optional: We can add a Tavily search here for the actual news, but let's wire it up simply first.
  const searchQuery = `${industry} startup product updates pricing funding ${new Date().getFullYear()}`;
  const searchRaw = await search(searchQuery, { searchDepth: 'basic', maxResults: 5, topic: 'news', timeRange: 'month' });
  const raw = await trendRadar(industry, JSON.stringify(searchRaw));
  return { result: safeJsonParse(raw, {}, 'Trend Radar'), raw };
}

export async function runBiasCalibration(ideaStr: string, founderStr: string, token?: string) {
  checkAuth(token);
  const raw = await founderBiasCalibrator(ideaStr, founderStr);
  return { result: safeJsonParse(raw, {}, 'Bias Calibration'), raw };
}

export async function runFactCheck(phaseOutputsStr: string, token?: string) {
  checkAuth(token);
  // 1. Extract claims
  const claimsRaw = await extractClaims(phaseOutputsStr);
  const claimsParsed = safeJsonParse(claimsRaw, { testableClaims: [] }, 'Extract Claims');
  
  // 2. Search for each claim
  const searchPromises = (claimsParsed.testableClaims || []).slice(0, 3).map(async (c: any) => {
    const s = await search(c.searchQuery, { searchDepth: 'basic', maxResults: 3 });
    return { claim: c.claim, searchResults: s.results };
  });
  const searchResults = await Promise.all(searchPromises);
  
  // 3. Fact check
  const raw = await factCheckClaims(JSON.stringify(searchResults));
  return { result: safeJsonParse(raw, {}, 'Fact Check'), raw };
}

export async function runConsistencyAudit(allPhaseOutputsStr: string, token?: string) {
  checkAuth(token);
  const raw = await consistencyAuditor(allPhaseOutputsStr);
  return { result: safeJsonParse(raw, {}, 'Consistency Audit'), raw };
}

export async function runUnitEconVerification(financialOutputStr: string, industry: string, token?: string) {
  checkAuth(token);
  const searchQuery = `${industry} SaaS unit economics benchmarks CAC LTV gross margin churn ${new Date().getFullYear()}`;
  const searchRaw = await search(searchQuery, { searchDepth: 'advanced', maxResults: 5 });
  const raw = await unitEconomicsVerifier(financialOutputStr, JSON.stringify(searchRaw));
  return { result: safeJsonParse(raw, {}, 'Unit Econ Verifier'), raw };
}

export async function runGraveyardAnalysis(ideaStr: string, industry: string, token?: string) {
  checkAuth(token);
  const searchQuery = `${industry} startup failed shutdown post-mortem crunchbase indiehackers`;
  const searchRaw = await search(searchQuery, { searchDepth: 'advanced', maxResults: 8 });
  const raw = await survivorshipBiasDetector(ideaStr, JSON.stringify(searchRaw));
  return { result: safeJsonParse(raw, {}, 'Graveyard Analysis'), raw };
}

export async function runSecondOpinion(finalVerdictStr: string, allPhaseOutputsStr: string, truthDataStr: string, token?: string) {
  checkAuth(token);
  const raw = await secondOpinionReview(finalVerdictStr, allPhaseOutputsStr, truthDataStr);
  return { result: safeJsonParse(raw, {}, 'Second Opinion'), raw };
}

