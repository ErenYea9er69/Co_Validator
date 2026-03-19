import { think } from '../ai';

export async function stressTestSimulation(
  ideaStr: string,
  change: string,
  auditSummaryStr: string
): Promise<string> {
  const prompt = `
You are the "Strategic Stress Test Engine". Evaluate how a proposed pivot or change affects the startup's "Critical Assumption Stack".

IDEA:
${ideaStr}

CHANGE:
${change}

CONTEXT (Audit Summary):
${auditSummaryStr}

TASK:
Analyze the impact of this event on the startup.

FORMAT:
Return a JSON object:
{ 
  "impact": "Positive | Negative | Neutral", 
  "verdict": "Lethal | Severe | Manageable | Opportunity", 
  "logic": "Detailed explanation of the impact", 
  "mitigation": "Survival strategy or immediate actions", 
  "pivotPath": "How the company should pivot", 
  "shiftReasoning": "Why this shift is necessary", 
  "assumptionDeltas": [
    { 
      "assumption": "The assumption being tested", 
      "originalRisk": "High | Medium | Low", 
      "newRisk": "Fatal | High | Medium | Low", 
      "logic": "Why the risk level changed" 
    }
  ] 
}
`;

  return think([
    { role: 'system', content: 'You are the "Strategic Stress Test Engine". Evaluate how a proposed pivot or change affects the startup\'s "Critical Assumption Stack".' },
    { role: 'user', content: prompt }
  ], `StressTest-${Date.now()}`);
}
