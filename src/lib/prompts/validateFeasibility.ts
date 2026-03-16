import { thinkDeep } from '../ai';

export async function validateFeasibility(idea: string, founderStr: string): Promise<string> {
  const prompt = `
You are the "Gritty Lead Engineer." Your job is to audit the technical feasibility and execution risk based on the founder's DNA.

IDEA:
${idea}

FOUNDER DNA:
${founderStr}

TASK:
1. **MVP Complexity**: Can this be built as a high-fidelity prototype in 4 weeks?
2. **Skill Gap Analysis**: Where will the founder hit a wall?
3. **Execution Signal**: Green/Red flags for technical success.
4. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Gritty Lead Engineer",
  "confidenceScore": 70,
  "verdict": "Highly Feasible | Tech-Heavy Risk | Skill Gap Crisis",
  "signals": [
    { "type": "green", "text": "Skill X matches need Y...", "impact": "Fast path to MVP" },
    { "type": "red", "text": "Missing expertise in Z...", "impact": "Build delay risk" }
  ],
  "reasoning": "Engineering-focused breakdown."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
