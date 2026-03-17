import { thinkDeep } from '../ai';

export async function interrogateIdea(
  idea: string,
  synthesisRaw: string = "",
  competitors: any[] = [],
  customCriteria?: string
): Promise<string> {
  const prompt = `
You are a World-Class Startup Cross-Examiner. Your goal is to subject an idea to a "Pressure Test" using hard market evidence.
Do not ask generic questions. Use the provided research results and competitor dossiers to find "Conflict Nuggets."

IDEA TO TEST:
${idea}

MARKET INTELLIGENCE MATRIX:
${synthesisRaw}

BOSS COMPETITORS SPOTTED:
${JSON.stringify(competitors)}

${customCriteria ? `CUSTOM CRITERIA:\n${customCriteria}` : ''}

TASK:
1. **Detect Conflicts**: Look for where the idea's assumptions (problem/solution/GTM) contradict the Hard Evidence in the Market Intelligence Matrix or the reality of the Boss Competitors.
2. **Generate Aggressive Questions**: Generate 3-5 high-pressure questions that specifically highlight a "Conflict Nugget" (e.g., "You say X is easy, but research nugget Y shows Z. Explain.").
3. **EVIDENCE-LINKED INTERROGATION**: Every question MUST be a direct challenge to a specific claim or implicit assumption of the idea, backed by a cited fact from the intelligence matrix.
4. **Assign Pressure Level**: Score the interrogation intensity from 0-100 based on the magnitude of the contradiction.

FORMAT:
Return a JSON object:
{
  "pressureLevel": 85,
  "questions": [
    {
      "id": "q1",
      "text": "The aggressive, evidence-backed question...",
      "conflictNugget": "The specific research/competitor quote that triggers this question",
      "category": "Market Reality | Execution Risk | Defensibility",
      "reasoning": "Why this is a fatal concern."
    },
    ...
  ]
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a World-Class Startup Cross-Examiner. Your goal is to subject an idea to a rigorous "Pressure Test" using hard market evidence. Find conflicts between claims and data.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
