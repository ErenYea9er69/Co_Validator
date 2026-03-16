import { thinkDeep, thinkFast } from '../ai';

export async function updateHypothesisConfidence(
  hypotheses: any[],
  searchSummary: string
): Promise<string> {
  const prompt = `
You are a Risk Analyst. Given a set of Fatal Hypotheses and a summary of new research findings, update the risk confidence score (0-100) for each hypothesis.

HYPOTHESES:
${JSON.stringify(hypotheses)}

RESEARCH FINDINGS:
${searchSummary}

TASK:
1. For each hypothesis, estimate how much more likely the "risk" is to be true based on the findings.
2. 0% = Risk is proven fake (Hypothesis disproven, Good news).
3. 100% = Risk is proven real (Hypothesis proven, Business is likely dead).

FORMAT:
Return a JSON array of objects:
[
  { "id": "h1", "confidence": 75, "proofGoal": "Updated status based on findings" },
  ...
]
`;

  return thinkFast([{ role: 'user', content: prompt }], { jsonMode: true });
}
