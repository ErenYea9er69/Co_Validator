import { thinkDeep } from '../ai';

export async function checkGraveyard(
  idea: string,
  rejectedIdeas: any[],
  founderDNA: any
): Promise<string> {
  const prompt = `
You are a startup database and pattern recognition engine. Your job is to compare a NEW startup idea against a "Graveyard" of past failures to detect potential dead-ends, repetitions, and execution risks.

NEW IDEA:
${idea}

FOUNDER DNA:
${JSON.stringify(founderDNA)}

THE SEMANTIC GRAVEYARD (PAST FAILURES):
${JSON.stringify(rejectedIdeas)}

TASK:
1. Analyze if the NEW idea is semantically similar to any past failures (names don't have to match, look for model/problem overlap).
2. If similarity > 70%, issue a "PROXIMITY ALERT" and explain exactly which previous failure it resembles.
3. Identify "Kill Signals": What specific market or execution trap from a past failure is this new idea likely to hit?
4. Suggest one "Survival Pivot": Based on what killed the previous similar idea, what must this new idea change immediately?

FORMAT:
Return a JSON object:
{
  "hasSimilarityAlert": boolean,
  "similarityScore": number (0-100),
  "matchedIdea": "Name of the past failure",
  "alertMessage": "A 1-2 sentence warning about the overlap.",
  "killSignals": ["Signal 1", "Signal 2"],
  "survivalStrategicAdvice": "One paragraph of brutal advice."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
