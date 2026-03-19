import { think } from '../ai';

export async function generateBlueprint(idea: string, risks: string): Promise<string> {
  const prompt = `
You are the "Tactical Execution Specialist." Your job is to create a 30-day "Blitz-Launch" plan.

IDEA:
${idea}

IDENTIFIED RISKS:
${risks}

TASK:
Create a high-velocity 30-day checklist. Group by week.
Focus on:
1. **Validation**: Talking to users.
2. **Build**: Minimal MVP features.
3. **Distribution**: How to get the first 10 customers.

FORMAT:
Return a JSON object:
{
  "weeks": [
    {
      "week": 1,
      "focus": "Problem Validation",
      "tasks": [
        { "day": 1, "task": "Interview 5 potential customers", "objective": "Verify pain point X" },
        ...
      ]
    },
    ... up to week 4
  ]
}
`;

  return think([
    { role: 'system', content: 'You are the Tactical Execution Specialist.' },
    { role: 'user', content: prompt }
  ], 'GenerateBlueprint');
}
