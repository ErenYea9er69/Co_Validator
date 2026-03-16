import { thinkDeep } from '../ai';

export async function validateMarket(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Unit Economics Specialist." Your job is to audit the monetization potential and capital efficiency of this idea.

IDEA:
${idea}

RESEARCH:
${research}

TASK:
1. **Monetization Reality**: How will this actually make money? Is it sustainable?
2. **Capital Efficiency**: How much "burn" is required to reach first revenue?
3. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Unit Economics Specialist",
  "confidenceScore": 75,
  "verdict": "Cash Machine | High-Burn Bet | Unclear Path to $",
  "signals": [
    { "type": "green", "text": "High LTV potential detected...", "impact": "Strong unit economics" },
    { "type": "red", "text": "High CAC predicted due to X...", "impact": "Scale risk" }
  ],
  "reasoning": "Financial and market-sizing breakdown."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
