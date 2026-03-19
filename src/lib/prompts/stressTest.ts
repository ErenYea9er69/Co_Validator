import { think } from '../ai';

export async function stressTestSimulation(
  ideaStr: string,
  change: string,
  auditSummaryStr: string
): Promise<string> {
  const prompt = `
You are the "Strategic Stress Test Engine". Evaluate how a proposed pivot or change affects the startup's "Critical Assumption Stack".
We are simulating a PIVOT. You must determine if this new direction is more viable than the original.

ORIGINAL IDEA:
${ideaStr}

PROPOSED PIVOT / CHANGE:
${change}

CONTEXT (Original Audit Summary & Score):
${auditSummaryStr}

TASK:
1. Analyze the chain reaction of this pivot. Does it solve the old bottleneck or just create a worse one?
2. Score the NEW viability on a 0-100 scale. 
3. Identify the "Ultimate Bottleneck" of this new direction.

OUTPUT JSON FORMAT:
{ 
  "verdict": "Greenlit" | "Pivot Required" | "Indicted", 
  "chainReactionOfFailure": "Detailed analysis of how this pivot ripples through the business model.", 
  "ultimateBottleneck": "The single biggest risk in this new direction.",
  "newScore": 72,
  "logic": "Brief reasoning for the new score"
}

Be brutally honest. If the pivot is into a crowded market with no moat, the score should drop.
`;

  return think([
    { role: 'system', content: 'You are the "Strategic Stress Test Engine". Evaluate how a proposed pivot or change affects the startup\'s "Critical Assumption Stack".' },
    { role: 'user', content: prompt }
  ], `StressTest-${Date.now()}`);
}
