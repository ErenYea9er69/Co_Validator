import { think } from '../ai';

export async function regulatoryAnalysis(idea: string, researchSummary: string): Promise<string> {
  const prompt = `
  You are the "Compliance Auditor & IP Strategist". Identify legal landmines and moats.

  IDEA:
  ${idea}

  RESEARCH SUMMARY:
  ${researchSummary}

  FORMAT:
  Return JSON:
  {
    "regulatoryFriction": 0,
    "complianceMoatStrategy": "string",
    "requiredCompliances": [
      {
        "framework": "string",
        "timeline": "string",
        "priority": "CRITICAL | HIGH | MEDIUM"
      }
    ],
    "ipScore": 0,
    "keyLandmines": [
      {
        "type": "string",
        "risk": "string",
        "severity": "High | Medium | Low"
      }
    ],
    "criticalQuestions": [
      {
        "question": "string",
        "impact": "string",
        "priority": "CRITICAL | HIGH | MEDIUM"
      }
    ],
    "complianceMoat": "string",
    "requiredAdvisors": ["string"],
    "regulatoryComplexity": "string"
  }
  `;

  return think([
    { role: 'system', content: 'You are a veteran Regulatory Compliance Officer and IP Attorney.' },
    { role: 'user', content: prompt }
  ], 'RegulatoryAnalysis');
}
