import { thinkDeep } from '../ai';

export async function finalScoring(
  idea: string, 
  allPhaseResults: string
): Promise<string> {
  const prompt = `
You are the "Master Investment Committee." Your job is to synthesize 8 expert reports into a final "Master Investment Verdict."

IDEA:
${idea}

EXPERT PHASE REPORTS:
${allPhaseResults}

TASK:
17. **Weighted Decision Heatmap**: Score the idea from 1-10 on the dimensions below. **CRITICAL**: Weight "Competition Realism," "Defensibility," and "Market Timing" 3x heavier than others. 
18. **COUNCIL CONFLICT RESOLUTION**: Detect where expert reports from different phases fundamentally conflict. Specifically, look for "Marketing Friction" (e.g., Phase 5: Market says "Low CAC" but Phase 6: Moat says "No network effects").
19. **Traction & Proof Audit**: Weight the user's \`tractionEvidence\` heavily. If proof is missing, apply a "Speculation Penalty" to the score.
20. **Confidence Calibration**: Identify where the expert disagreement is highest.
21. **Master Verdict**: Provide a final 🚀, ✅, ⚠️, or ❌.

DIMENSIONS:
Competition Realism (3x), Defensibility (3x), Market Timing (3x), Pain Intensity (2x), Buyer Urgency, Budget Clarity, Ease of MVP, 
Distribution Feasibility (2x), Speed to First Revenue, Traction Proof (2x), Capital Efficiency, Small-Team Feasibility, 
Expansion potential, Red Ocean Risk, Team Execution Risk, Unit Economics Logic (2x).

FORMAT:
Return a JSON object:
{
  "scores": { 
    "dimensionName": { "score": 1-10, "reason": "Why it got this score based on phase reports + inputs" },
    ... 
  },
  "compositeScores": {
    "overallWinnability": 0-100, // Weighted average
    "cashFlowPotential": 0-100,
    "ventureScalePotential": 0-100,
    "soloFounderFeasibility": 0-100,
    "growthEngineRigor": 0-100, // New: Logic of GTM
    "councilDiscord": 0-10
  },
  "dataQuality": {
    "isSurfaceLevel": false,
    "missingCriticalInfo": "Detailed explanation...",
    "realityCheck": "Blunt warning if traction/timing was ignored."
  },
  "marketingLogicFriction": "Identify if pricing covers CAC logic provided in inputs.",
  "category": "winnability | boring-strong | venture-backable | solo-founder | ai-defensible | marketing-heavy",
  "verdict": "🚀 | ✅ | ⚠️ | ❌",
  "verdictLabel": "Short punchy verdict description",
  "reasoning": "The Master Committee's synthesized logic.",
  "expertSignals": {
    "green": ["Top 3 green signals"],
    "red": ["Top 3 red signals"]
  }
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true, temperature: 0.3 });
}
