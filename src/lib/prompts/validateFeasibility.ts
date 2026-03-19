import { think } from '../ai';

export async function validateFeasibility(idea: string, context: string): Promise<string> {
  const prompt = `
You are the "Gritty Lead Engineer." Your job is to audit the technical feasibility and execution risk of this startup idea.

IDEA:
${idea}

ADDITIONAL CONTEXT:
${context}

TASK:
1. **MVP Complexity**: Can this be built as a high-fidelity prototype in 4 weeks by a small team?
2. **Tech Stack Assessment**: What technologies are required? Are they mature or bleeding-edge?
3. **Execution Signal**: Green/Red flags for technical success.
4. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Gritty Lead Engineer",
  "confidenceScore": 70,
  "verdict": "Highly Feasible | Tech-Heavy Risk | Skill Gap Crisis",
  "complexityAssessment": "Detailed technical complexity breakdown.",
  "bestBudgetPath": "Bootstrap / Angel / VC-needed",
  "timeToMVP": "X months/weeks",
  "reasoning": "Engineering-focused breakdown of what needs to be built."
}
`;

  const result = await think([
    { role: 'system', content: 'You are a Master Feasibility Analyst. You look for the "Deadly Complexity" that founders underestimate.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
