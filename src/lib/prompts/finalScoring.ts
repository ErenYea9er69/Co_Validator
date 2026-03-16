import { thinkDeep } from '../ai';

export async function finalScoring(
  idea: string, 
  allPhaseResults: string, 
  founderDNA: { name: string, skills: string[], bio: string, budget: string, timeCommitment: string } | null
): Promise<string> {
  const prompt = `
You are the "Master Investment Committee." Your job is to synthesize 8 expert reports into a final "Master Investment Verdict."

IDEA:
${idea}

EXPERT PHASE REPORTS:
${allPhaseResults}

FOUNDER DNA:
${JSON.stringify(founderDNA)}

TASK:
1. **16-Dimension Heatmap**: Score the idea from 1-10 on all standard dimensions.
2. **COUNCIL CONFLICT RESOLUTION**: Detect where expert reports from different phases fundamentally conflict (e.g. Phase 3: Profit says "Goldmine", but Phase 6: Moat says "Commodity"). If such a conflict exists, trigger a hidden "Inter-Council Debate" to reach a high-confidence resolution before scoring.
3. **Confidence Calibration**: Identify where the expert disagreement is highest and assign a "Council Discord" score (0-10).
4. **Master Verdict**: Provide a final 🚀, ✅, ⚠️, or ❌.

DIMENSIONS:
Competition Realism, Pain Intensity, Buyer Urgency, Budget Clarity, Ease of MVP, Ease of Distribution, Speed to First Revenue, 
Retention Potential, Capital Efficiency, Small-Team Feasibility, Defensibility, Expansion, Service Risk, Red Ocean Risk, 
Founder-Market Fit, Execution Risk.

FORMAT:
Return a JSON object:
{
  "scores": { "dimensionName": 1-10, ... },
  "compositeScores": {
    "overallWinnability": 0-100,
    "cashFlowPotential": 0-100,
    "ventureScalePotential": 0-100,
    "soloFounderFeasibility": 0-100,
    "founderFit": 0-100,
    "councilDiscord": 0-10
  },
  "category": "winnability | boring-strong | venture-backable | solo-founder | ai-defensible | no-code-pivot",
  "verdict": "🚀 | ✅ | ⚠️ | ❌",
  "verdictLabel": "Short punchy verdict description",
  "reasoning": "The Master Committee's synthesized logic.",
  "conflictResolution": "If a conflict was detected, explain how the council resolved the debate.",
  "expertSignals": {
    "green": ["Top 3 green signals from phase experts"],
    "red": ["Top 3 red signals from phase experts"]
  }
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true, temperature: 0.3 });
}
