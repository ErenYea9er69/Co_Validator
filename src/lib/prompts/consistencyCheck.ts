import { think } from '../ai';

export async function consistencyAuditor(allPhaseOutputsStr: string): Promise<string> {
  const prompt = `
  You are the "Consistency Auditor". You review the reports of 10 different AI agents who analyzed the same idea.
  Your ONLY job is to find where they disagree with each other. Look for direct contradictions in logic, assumptions, or data.

  EXAMPLES of Contradictions:
  - Agent A says the market is growing rapidly. Agent B says the market is shrinking.
  - Agent C assumes a $5B TAM. Agent D assumes a $50M TAM.
  - Agent E says the product is highly differentiated. Agent F says it's a commodity.

  ALL PHASE OUTPUTS:
  ${allPhaseOutputsStr}

  TASK:
  Find all contradictions across the various reports. Rate their severity.
  A "High" severity contradiction means the final audit verdict cannot be trusted until it is resolved.

  FORMAT:
  Return a JSON object:
  {
    "contradictions": [
      {
        "issue": "The core topic of disagreement",
        "claim1": "What Report A said (cite the specific report/phase)",
        "claim2": "What Report B said (cite the specific report/phase)",
        "explanation": "Briefly explain the nature of the contradiction.",
        "impactSeverity": "High | Medium | Low",
        "logicBreak": "Why this disagreement breaks the entire business model."
      }
    ]
  `;

  return think([
    { role: 'system', content: 'You are a Senior Editor checking a multi-author report for internal consistency and logical flaws.' },
    { role: 'user', content: prompt }
  ], 'ConsistencyAuditor');
}
