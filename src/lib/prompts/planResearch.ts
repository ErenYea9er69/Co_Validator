import { thinkFast } from '../longcat';

export async function planResearch(
  focusAreas: string[],
  excludedCategories: string[],
  pastRejections: string, 
  founderDNA: { name: string, skills: string[], bio: string, budget: string, timeCommitment: string, availableHours: number } | null,
  customCriteria?: string
): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const messages = [
    {
      role: 'system' as const,
      content: `You are a Strategy Architect. Current Date: ${currentDate}.
Your job is to design a hypothesis-driven research plan that doesn't just "find info," but actively HUNTS for reasons why a startup idea might fail.
Focus on prove/disprove mechanisms for critical risks.`,
    },
    {
      role: 'user' as const,
      content: `Design a hypothesis-driven research plan for finding or validating startup opportunities.

FOCUS AREAS: ${focusAreas.length > 0 ? focusAreas.join(', ') : 'BROAD SEARCH'}
EXCLUDED: ${excludedCategories.length > 0 ? excludedCategories.join(', ') : 'None'}

FOUNDER DNA:
- Name: ${founderDNA?.name || 'Anonymous'}
- Skills: ${founderDNA?.skills.join(', ') || 'Generalist'}

${customCriteria ? `CUSTOM CRITERIA: ${customCriteria}` : ''}

THE GRAVEYARD (Past Failures):
${pastRejections || 'None'}

TASK:
1. Generate 3 "Fatal Hypotheses": These are the most critical assumptions that could kill a business in this space.
2. DESIGN A "DEVIL'S ADVOCATE" REPORT: Explicitly list 3 structural reasons why this industry or problem space is "un-disruptable" or "fixed" (e.g. regulatory capture, insurmountable incumbents, historical failure patterns).
3. Design research angles specifically to prove or disprove these hypotheses and cross-reference the Devil's Advocate risks.
4. Identify specific "Kill Signals" (e.g., "Finding a dominant open-source alternative").

FORMAT:
Return a JSON object:
{
  "devilsAdvocate": {
    "barriers": ["Barrier 1", "Barrier 2", "Barrier 3"],
    "historicalFailures": "Summary of why others usually fail here"
  },
  "hypotheses": [
    {
      "id": "h1",
      "text": "The hypothesis statement",
      "riskLevel": "Critical",
      "proofGoal": "What evidence we need to find",
      "startingConfidence": 50
    }
  ],
  "researchAngles": [
    {
      "angle": "What to research",
      "targetHypothesis": "h1",
      "searchType": "market_gaps | failed_startups | trends | pain_points | ecosystem",
      "rationale": "Why this proves/disproves the hypothesis"
    }
  ],
  "keyStrategy": "One sentence on the overall tactical hunt."
}`,
    },
  ];

  return thinkFast(messages, { jsonMode: true, temperature: 0.8 });
}
