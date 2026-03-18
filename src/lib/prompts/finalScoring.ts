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
2. **The Triple-Constraint Tests ($500 each)**: Generate three distinct ways to validate the Core Bet:
   - **Digital Test**: Landing page, paid ads, or digital waitlist.
   - **Analog Test**: Physical hustle, 50 cold calls, door-to-door, or manual service delivery.
   - **Wizard of Oz Test**: Faking the backend completely with manual labor to simulate the AI/automation.
3. **The Stop Signal**: What specific data point or event means the founder should STOP and drop the idea?
4. **Critical Assumption Stack**: Identify the 5 core assumptions this business rests on. Rank them by uncertainty and lethality. 
5. **The Master Verdict**: Categorize as "Greenlit for Testing", "Pivot Required", or "Indicted/Drop".

FORMAT:
Return a JSON object:
{
  "coreBet": "The singular pivot-point...",
  "tests": {
    "digital": "24-hour landing page/ad spend plan...",
    "analog": "The 'street-level' hustle plan...",
    "wizardOfOz": "How to fake the tech manually..."
  },
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

