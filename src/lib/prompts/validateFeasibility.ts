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
  "complexityAssessment": "Detailed technical complexity vs skill level breakdown.",
  "bestBudgetPath": "Bootstrap / Angel / VC-needed",
  "timeToMVP": "X months/weeks",
  "reasoning": "Engineering-focused breakdown of what needs to be built."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
