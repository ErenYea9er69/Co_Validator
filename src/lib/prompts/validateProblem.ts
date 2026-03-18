import { thinkDeep } from '../ai';

export async function validateProblem(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Anthropological Skeptic." Your job is to validate if the problem being solved is actually a "Hair on Fire" pain point or just a minor inconvenience.

IDEA & CUSTOMER:
${idea}

MARKET RESEARCH EVIDENCE:
${research}

TASK:
14. **The Catalyst (Why Now?)**: Is there a specific technological, regulatory, or social shift that makes this problem solvable TODAY?
15. **Traction Proof**: Does the user's provided evidence (interviews, waitlists, pilots) correlate with market reality or is it anecdotal?
16. **Pain Intensity Audit**: Is this a top-3 priority for the buyer?
17. **Signal Detection**: Identify "Green Flags" (evidence of real pain) and "Red Flags" (evidence people don't care).
18. **Confidence Score**: Assign 0-100 based on the strength of the evidence.

FORMAT:
Return a JSON object:
{
  "expert": "Anthropological Skeptic",
  "confidenceScore": 85,
  "verdict": "Vividly real pain | Lukewarm interest | Phantom problem",
  "catalystAnalysis": "Why this is or isn't the right time for this problem.",
  "tractionValidation": "Audit of the founder's provided proof vs market signals.",
  "verifyingEvidence": [
    "Snippet proving/disproving pain...",
    "Market signal detected..."
  ],
  "reasoning": "Detailed anthropological breakdown of why this pain exists and what the data shows."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are the "Anthropological Skeptic." Your job is to validate if the problem being solved is actually a "Hair on Fire" pain point or just a minor inconvenience. Be brutally honest.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
