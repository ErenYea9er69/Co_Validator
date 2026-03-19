import { think } from '../ai';

export async function regulatoryAnalysis(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are a "Regulatory & Compliance Architect". Your job is to identify the non-obvious regulatory hurdles that kill startups.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **The 7 Critical Regulatory Questions**: Generate 7 highly specific "Yes/No" or "Quantitative" questions that the founder MUST be able to answer to prove they understand the regulatory landscape (e.g., 'Do you have a person-in-charge named for GDPR Article 27?').
2. **The "Moat" Assessment**: How can compliance be used to block incumbents or newer competitors?
3. **Required Advisor Personas**: Identify the 3 specific types of legal/regulatory experts the founder needs to hire *immediately* (e.g., 'BOPIS-specialist attorney', 'HIPAA-auditor').

FORMAT:
Return a JSON object:
{
  "criticalQuestions": [
    { "question": "...", "whyItMatters": "...", "riskIfUnanswered": "High | Med | Low" }
  ],
  "complianceMoat": "Strategy to turn hurdles into defensive barriers.",
  "regulatoryFriction": number, // 0-10
  "complianceMoatStrategy": "string",
  "requiredCompliances": ["string"],
  "ipScore": number, // 0-100
  "keyLandmines": [
    { "type": "...", "risk": "...", "severity": "..." }
  ],
  "requiredAdvisors": [
    { "persona": "...", "expertiseRequired": "...", "hiringPriority": "Immediate | Post-Seed" }
  ],
  "regulatoryComplexity": "Low | Moderate | High | Moonshot"
}
`;

  const result = await think([
    { role: 'system', content: 'You are a Master Strategic Analyst specializing in regulatory risk and compliance moats.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
