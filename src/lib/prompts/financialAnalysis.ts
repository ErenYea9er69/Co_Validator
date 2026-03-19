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
    "survivalSkeleton": {
      "maxAffordableCAC": 0,
      "minSurvivalChurn": 0,
      "burnToFirstMilestone": 0,
      "minTargetACV": 0
    },
    "deathGuillotine": {
      "monthsToZero": 0,
      "cashOutDate": "string",
      "burnBreakdown": "string",
      "fatalConstraint": "string"
    },
    "breakevenConditions": "string",
    "stressTests": [
      {
        "scenario": "string",
        "impact": "string"
      }
    ],
    "unitEconomics": {
      "LTV": 0,
      "CAC": 0,
      "grossMargin": 0
    },
    "fundingRequiredToScale": "string",
    "capitalIntensity": "Low | Medium | High",
    "exitScore": 0,
    "exitScenarios": [
      {
        "acquirer": "string",
        "estimatedMultiple": "string",
        "logic": "string"
      }
    ]
  }
  `;

  return think([
    { role: 'system', content: 'You are a ruthless CFO looking for the path to profitability and exit.' },
    { role: 'user', content: prompt }
  ], 'FinancialAnalysis');
}
