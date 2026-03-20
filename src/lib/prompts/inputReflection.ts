import { think } from '../ai';

export async function inputReflection(idea: any): Promise<string> {
  const prompt = `
  You are the "Audit Mirror". Your job is to summarize exactly what the user provided so they know you understood their intent perfectly before the audit results are shown.

  USER INPUT DATA:
  ${JSON.stringify(idea)}

  TASK:
  1. Summarize the "Problem" they are solving (1 sentence).
  2. Summarize the "Solution" they proposed (1 sentence).
  3. Identify the "Key Traction Claim" (if any).
  4. Identify the "Assumed Business Model".

  FORMAT:
  Return a JSON object:
  {
    "problemSnapshot": "...",
    "solutionSnapshot": "...",
    "monetizationSnapshot": "...",
    "tractionClaim": "...",
    "mirrorStatement": "A 1-sentence confirmation that the AI has 'captured' the essence of their vision."
  }
  `;

  return think([
    { role: 'system', content: 'You are a meticulous auditor who values accuracy and alignment above all else.' },
    { role: 'user', content: prompt }
  ], 'InputReflection');
}
