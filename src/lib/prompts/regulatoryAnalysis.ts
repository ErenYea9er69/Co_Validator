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
    "requiredCompliances": ["string"],
    "ipScore": 0,
    "keyLandmines": ["string"]
  }
  `;

  return think([
    { role: 'system', content: 'You are a veteran Regulatory Compliance Officer and IP Attorney.' },
    { role: 'user', content: prompt }
  ], 'RegulatoryAnalysis');
}
