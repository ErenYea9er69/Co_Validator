import { think } from '../ai';

export async function validateProblem(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Anthropological Skeptic." Your job is to validate if the problem being solved is actually a "Hair on Fire" pain point or just a minor inconvenience.

IDEA & CUSTOMER:
${idea}

MARKET RESEARCH EVIDENCE:
${research}

TASK:
1. **The Catalyst (Why Now?)**: Is there a specific technological, regulatory, or social shift that makes this problem solvable TODAY?
2. **Traction Verification**: Audit the provided 'tractionEvidence' and 'tractionDocs'. Are they verified facts or unproven claims?
3. **Pain Intensity Audit**: Is this a top-3 priority for the buyer?
4. **Signal Detection**: Identify "Green Flags" (evidence of real pain) and "Red Flags" (evidence people don't care).
5. **Confidence Score**: Assign 0-100 based on the strength of the evidence.


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

  return think([
    { role: 'system', content: 'You are an "Anthropological Investigator" specializing in startup failure patterns. You look for the "Tarpit" — ideas that look good but have hidden, fatal flaws.' },
    { role: 'user', content: prompt }
  ], 'ProblemValidation');
}
