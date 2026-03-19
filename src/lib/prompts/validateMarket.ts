import { think } from '../ai';

export async function validateMarket(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Unit Economics Specialist." Your job is to audit the monetization potential and capital efficiency of this idea.

IDEA:
${idea}

RESEARCH:
${research}

TASK:
1. **Monetization Reality**: How will this actually make money? Is the user's \`targetPricing\` realistic for this audience?
2. **Acquisition Efficiency**: Is the \`acquisitionChannel\` scalable? Compare the user's acquisition logic against industry benchmarks for CAC.
3. **Capital Efficiency**: How much "burn" is required to reach first revenue?
4. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Unit Economics Specialist",
  "confidenceScore": 75,
  "verdict": "Cash Machine | High-Burn Bet | Unclear Path to $",
  "marketingLogicAudit": "Critique of the proposed acquisition channel and pricing alignment.",
  "unitEconomicsReality": {
    "ltv": "Estimate based on pricing",
    "cac": "Estimated cost to acquire via user's channel",
    "margin": "Gross margin estimate",
    "payback": "Time to recover CAC"
  },
  "reasoning": "Financial and market-sizing breakdown of how this scales."
}
`;

  const result = await think([
    { role: 'system', content: 'You are the "Unit Economics Specialist." Your job is to audit the monetization potential, capital efficiency, and financial viability of startup ideas. Be data-driven and realistic.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
