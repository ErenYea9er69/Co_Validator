import { think } from '../ai';

export async function generatePitchDeck(idea: any, auditResult: any): Promise<string> {
  const prompt = `
You are a master pitch deck architect who writes decks that actually raise money.
We need to generate a 10-slide pitch deck structure for this startup idea.
You have the founder's raw idea and the results of a Brutal AI Audit.

IDEA:
Name: ${idea.name}
Problem: ${idea.problem}
Target Audience: ${idea.targetAudience}

AUDIT RESULTS:
Verdict: ${auditResult.verdict}
Core Bet: ${auditResult.coreBet}
Critical Assumptions: ${auditResult.criticalAssumptionStack?.map((a: any) => typeof a === 'string' ? a : a.assumption).join(' | ')}

TASK:
Generate a 10-slide pitch deck. Each slide must be punchy, hype-free, and address the reality of the market.
Do not sugarcoat. If the idea requires a pivot, write the deck for the *pivoted* version implied by the Core Bet.

OUTPUT JSON FORMAT:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Title of the slide",
      "subtitle": "A one-sentence punchy takeaway for this slide",
      "bulletPoints": ["Point 1", "Point 2", "Point 3"],
      "speakerNotes": "What the founder should actually say out loud when presenting."
    }
  ]
}

Ensure exactly 10 slides following standard Sequoia format (Problem, Solution, Why Now, Market Potential, Competition, Business Model, Team, Financials/Traction, Vision, The Ask).
`;

  return think(prompt, "PitchDeckGenerator");
}
