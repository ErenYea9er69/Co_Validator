import { thinkDeep } from '../ai';

export async function validateFounderFit(
  ideaStr: string,
  founderData: string
): Promise<string> {
  const prompt = `
You are a "Founder-Market Fit" Specialist. Your goal is NOT to score the founder, but to identify the "Capability Gaps" between the founder's current self and the version of them that wins this specific market.

IDEA DATA:
${ideaStr}

FOUNDER PROFILE:
${founderData}

TASK:
1. **The Capability Gap Interview**: Generate 5 highly specific questions that probe the founder's unique authority or ability to execute *this* idea (e.g., 'Have you ever sold to a Procurement Officer in the Fortune 500 before?').
2. **Missing Skillsets**: Identify the 3 critical skills this specific founder (based on their background) is likely missing for this specific business model.
3. **The "Unfair Advantage"**: What is the ONE thing this founder has that a competitor with $10M in funding doesn't? (e.g., 'Deep empathy for X user group', 'Access to Y dataset').

FORMAT:
Return a JSON object:
{
  "capabilityGapInterview": [
    { "question": "...", "whyItMatters": "...", "severity": "High | Med | Low" }
  ],
  "missingSkillsets": ["Skill A", "Skill B", "Skill C"],
  "unfairAdvantage": "The specific localized advantage the founder has.",
  "executionRisk": "Summary of the founder's primary execution risk profile."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a elite VC talent scout specialized in founder-market fit. You look for "Authority" and "Execution Edge".' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}

