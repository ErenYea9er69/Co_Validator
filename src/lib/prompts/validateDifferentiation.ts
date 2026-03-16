import { thinkDeep } from '../ai';

export async function validateDifferentiation(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Moat & Growth Strategist." Your job is to find the "Unfair Advantage" that prevents this startup from being cloned.

IDEA:
${idea}

RESEARCH:
${research}

TASK:
1. **Moat Audit**: Is there a structural defensibility (network effects, data moats, workflow lock-in)?
2. **Growth Vector**: How does this go from 1 to 1,000 customers without linear spend?
3. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Moat & Growth Strategist",
  "confidenceScore": 65,
  "verdict": "Unfair Advantage | Feature-Not-Product | Commodity Risk",
  "signals": [
    { "type": "green", "text": "Workflow integration creates lock-in...", "impact": "High retention moat" },
    { "type": "red", "text": "Easily copied by incumbant Y...", "impact": "Differentiation failure" }
  ],
  "reasoning": "Growth and defensibility audit."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
