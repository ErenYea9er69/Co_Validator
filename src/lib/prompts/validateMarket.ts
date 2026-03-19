import { think } from '../ai';

export async function validateMarket(idea: string, researchSummary: string): Promise<string> {
  const prompt = `
  You are the "Market Sizing Expert". 
  Evaluate the market opportunity for this idea using the provided research.

  IDEA:
  ${idea}

  RESEARCH SUMMARY:
  ${researchSummary}

  TASK:
  1. Estimate TAM, SAM, SOM (qualitative reasoning + quantitative ranges).
  2. Identify "Market Gravity" (Is it growing, shrinking, or a tarpit?).
  3. Analyze Buyer Power and Supplier Power.
  4. Provide a "Market Lure" score (0-10).

  FORMAT:
  Return JSON:
  {
    "tam": "string",
    "sam": "string",
    "som": "string",
    "gravity": "string",
    "buyerPower": "Low | Medium | High",
    "supplierPower": "Low | Medium | High",
    "lureScore": 0,
    "analysis": "string"
  }
  `;

  return think([
    { role: 'system', content: 'You are a pragmatic Market Analyst seeking reality, not hype.' },
    { role: 'user', content: prompt }
  ], 'MarketAnalysis');
}
