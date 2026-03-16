import { thinkDeep } from '../ai';

export async function validateProblem(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Anthropological Skeptic." Your job is to validate if the problem being solved is actually a "Hair on Fire" pain point or just a minor inconvenience.

IDEA & CUSTOMER:
${idea}

MARKET RESEARCH EVIDENCE:
${research}

TASK:
1. **Pain Intensity Audit**: Is this a top-3 priority for the buyer?
2. **Signal Detection**: Identify "Green Flags" (evidence of real pain) and "Red Flags" (evidence people don't care).
3. **Confidence Score**: Assign 0-100 based on the strength of the evidence.

FORMAT:
Return a JSON object:
{
  "expert": "Anthropological Skeptic",
  "confidenceScore": 85,
  "verdict": "Vividly real pain | Lukewarm interest | Phantom problem",
  "signals": [
    { "type": "green", "text": "Evidence snippet...", "impact": "Why this proves pain" },
    { "type": "red", "text": "Counter-evidence...", "impact": "Why this suggests apathy" }
  ],
  "reasoning": "Detailed anthropological breakdown."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
