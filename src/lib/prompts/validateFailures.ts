import { think } from '../ai';

export async function validateFailures(idea: string, fullValidationContext: string): Promise<string> {
  const prompt = `
List the top 5 failure scenarios for this startup idea.

IDEA:
${idea}

VALIDATION CONTEXT SO FAR:
${fullValidationContext}

Be brutally realistic. Consider:
- Market timing failures
- Distribution/acquisition failures
- Retention failures
- Competitive response
- Technical/operational failures
- Founder/team failures
- Financial/unit economics failures

Output JSON:
{
  "failureScenarios": [
    {
      "rank": 1,
      "name": "short threat name",
      "scenario": "what goes wrong",
      "trigger": "the specific event that triggers this failure",
      "probability": "High | Medium | Low",
      "impact": "fatal | severe | manageable",
      "mitigation": "how to reduce this risk",
      "fatalLoop": "the feedback loop that leads to death"
    }
  ],
  "mostLikelyDeathCause": "the single most likely way this dies",
  "founderTrap": "the execution trap founders fall into with this type of idea",
  "summary": "overall risk assessment"
}
`;

  return think([
    { role: 'system', content: 'You are a startup failure analyst. Phase 7: FAILURE SCENARIOS. Be brutally realistic. Don\'t sugarcoat.' },
    { role: 'user', content: prompt }
  ], 'FailureAnalysis');
}
