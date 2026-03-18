import { thinkDeep } from '../ai';

export async function finalScoring(
  idea: string, 
  allPhaseResults: string
): Promise<string> {
  const prompt = `
You are the "Master Investment Committee". Your job is to synthesize all expert reports, the adversarial debate, and the competitive retaliation simulation into a final "Ground Truth Synthesis".

IDEA:
${idea}

EXPERT PHASE REPORTS, DEBATE, & COMPETITIVE RESPONSE:
${allPhaseResults}

TASK:
1. **The Core Business Bet**: Define the singular, most important "bet" that must be true for this business to succeed.
2. **The Cheapest Test ($500/14 Days)**: What is the absolute cheapest, fastest way to validate or invalidate the Core Bet?
3. **The Stop Signal**: What specific data point or event means the founder should STOP and drop the idea?
4. **Critical Assumption Stack**: Identify the 5 core assumptions this business rests on. Rank them by uncertainty and lethality. Provide a 2-week test agenda for the #1 assumption.
5. **The verdict**: Categorize as "Greenlit for Testing", "Pivot Required", or "Indicted/Drop".

FORMAT:
Return a JSON object:
{
  "coreBet": "The singular pivot-point...",
  "cheapestTest": "The 24-hour / $500 test...",
  "stopSignal": "The metric or event that means 'Game Over'...",
  "verdict": "Greenlit for Testing | Pivot Required | Indicted",
  "criticalAssumptionStack": [
    {
      "rank": 1,
      "assumption": "...",
      "uncertainty": "High | Medium",
      "lethality": "Fatal | Dangerous",
      "testAgenda": "Step-by-step for the next 14 days."
    }
  ],
  "reasoning": "The Master Committee's final synthesized logic.",
  "vulnerabilityScan": ["Top 3 internal red flags"],
  "opportunityScan": ["Top 3 asymmetric green flags"]
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true, temperature: 0.3 });
}

