import { think } from '../ai';

export async function competitiveResponse(idea: string, researchSummary: string): Promise<string> {
  const prompt = `
  You are the "Incumbent Strategist". How will the market leaders retaliate?

  IDEA:
  ${idea}

  RESEARCH SUMMARY:
  ${researchSummary}

  FORMAT:
  Return JSON:
  {
    "retaliationMoves": [
      {
        "competitor": "string",
        "lethality": "Fatal | Severe | Moderate",
        "move": "string",
        "probability": "High | Medium | Low"
      }
    ],
    "silentKiller": {
      "name": "string",
      "pivotLogic": "string",
      "threatLevel": "string"
    },
    "unscalableAdvantage": "string",
    "competitiveMoat": "string"
  }
  `;

  return think([
    { role: 'system', content: 'You are a senior strategist at a dominant market incumbent.' },
    { role: 'user', content: prompt }
  ], 'CompetitiveResponse');
}
