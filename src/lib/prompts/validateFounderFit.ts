import { thinkDeep } from '../ai';

export async function validateFounderFit(
  ideaStr: string,
  founderData: string
): Promise<string> {
  const prompt = `
You are a "Founder-Market Fit" Specialist at a top-tier VC firm.
Your task is to evaluate if the person describing the idea is the RIGHT person to build it.

IDEA DATA:
${ideaStr}

FOUNDER PROFILE:
${founderData}

EVALUATION CRITERIA:
1. **Relevant Experience**: Does the founder have industry or technical experience that gives them an advantage?
2. **Resource Alignment**: Is their budget/capital sufficient for the complexity of this idea?
3. **Execution Edge**: What "unfair advantage" does this specific person bring?
4. **Geography/Locale**: Does their location help or hurt the business model?

Return a JSON object:
{
  "score": number, // 1-10
  "verdict": "string", // "Strong Fit", "Moderate Fit", "Gap Detected", "Misaligned"
  "reasoning": "string", // 2-3 sentences
  "strengths": ["string"],
  "vulnerabilities": ["string"],
  "advice": "string" // Practical advice to bridge the gap (e.g., "Find a technical co-founder")
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a world-class VC talent evaluator. You judge if a founder is uniquely qualified to win given their background and resources.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
