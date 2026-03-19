import { think } from '../ai';

export async function financialAnalysis(idea: string, researchSummary: string): Promise<string> {
  const prompt = `
  You are the "Venture CFO". Analyze the financial viability and exit potential.

  IDEA:
  ${idea}

  RESEARCH SUMMARY:
  ${researchSummary}

  FORMAT:
  Return JSON:
  {
    "breakevenConditions": "string",
    "exitScore": 0,
    "exitScenarios": ["string"],
    "unitEconomics": "string",
    "fundingRequiredToScale": "string",
    "capitalIntensity": "Low | Medium | High",
    "stressTests": ["string"]
  }
  `;

  return think([
    { role: 'system', content: 'You are a ruthless CFO looking for the path to profitability and exit.' },
    { role: 'user', content: prompt }
  ], 'FinancialAnalysis');
}
