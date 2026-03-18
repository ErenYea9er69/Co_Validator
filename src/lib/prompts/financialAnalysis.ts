import { thinkDeep } from '../ai';

export async function financialAnalysis(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are a "VC Deal Partner & Financial Architect". Your job is to dissect the unit economics and exit potential of a startup idea.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **Unit Economics Breakdown**: 
   - Estimate the LTV (Lifetime Value) based on the target pricing and industry average churn.
   - Estimate the CAC (Customer Acquisition Cost) for the chosen acquisition channels.
   - Calculate the LTV:CAC ratio. Is it sustainable (>3:1)?
2. **Capital Efficiency & Intensity**: 
   - How much "Burn" is required to reach a \$1M ARR milestone?
   - Is this a "Blitzscaling" play or a "Capital-Efficient" play?
3. **Exit Analysis**: 
   - Identify 3-5 potential acquirers (e.g., Google, Salesforce, Snowflake, Stripe).
   - What are the current revenue multiples for this industry (e.g., 5x, 10x, 20x)?
   - What is the "Exit Velocity"?

FORMAT:
Return a JSON object:
{
  "unitEconomics": {
    "estimatedLTV": 1500,
    "estimatedCAC": 300,
    "ltvCacRatio": 5.0,
    "paybackPeriodMonths": 6,
    "grossMargin": 85
  },
  "capitalIntensity": "Medium",
  "fundingRequiredToScale": "$2M - $5M for Series A",
  "exitScenarios": [
    { "acquirer": "...", "logic": "...", "estimatedMultiple": "8-12x ARR" }
  ],
  "exitScore": 75
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a CFO and Deal Partner for a top-tier VC fund like Sequoia or Benchmark.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
