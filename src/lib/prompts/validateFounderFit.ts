import { think } from '../ai';

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
    1. **The Founder Reality Check (Technical Probe)**: If the idea is software-based, generate a "Technical Bottleneck" question. Ask about their tech stack choice vs. a specific execution risk (e.g. 'How will you handle real-time sync for X?' or 'What is your strategy for API rate limits?'). If they give a vague "I will hire someone" answer, flag it as a fatal risk.
    2. **Sweat Equity Assessment**: Evaluate their ability to build a "Scrappy MVP" vs. just managing a project. Corporate titles (VP, Director) are often a liability in 0-to-1 startups.
    3. **Missing Skillsets**: Identify the 3 critical skills this specific founder is missing.
    4. **The "Unfair Advantage"**: Identify the ONE thing they have that a $10M funded competitor doesn't.

    FORMAT:
    Return a JSON object:
    {
      "realityCheck": { "question": "...", "targetBottleneck": "...", "failureSignal": "What a 'fake' answer looks like." },
      "capabilityGapInterview": [
        { "question": "...", "whyItMatters": "...", "severity": "High | Med | Low" }
      ],
      "missingSkillsets": ["Skill A", "Skill B", "Skill C"],
      "unfairAdvantage": "The specific localized advantage.",
      "executionRisk": "Summary of 'Sweat Equity' vs 'Corporate Bloat' risk profile."
    }
`;

  return think([
    { role: 'system', content: 'You are a elite VC talent scout specialized in founder-market fit. You look for "Authority" and "Execution Edge".' },
    { role: 'user', content: prompt }
  ], 'FounderFitAnalysis');
}
