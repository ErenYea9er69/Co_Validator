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
  "unitEconomicsReality": {
    "ltv": "Estimate",
    "cac": "Estimate",
    "margin": "Estimate",
    "payback": "Estimate"
  },
  "reasoning": "Financial and market-sizing breakdown of how this scales."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are the "Unit Economics Specialist." Your job is to audit the monetization potential, capital efficiency, and financial viability of startup ideas. Be data-driven and realistic.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
