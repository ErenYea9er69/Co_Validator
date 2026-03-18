import { thinkDeep } from '../ai';

export async function regulatoryAnalysis(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are a "Legal & Regulatory Strategy Specialist". Your job is to identify the "Indicted" status of a startup idea from an IP and Regulatory standpoint.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **IP Fortress Analysis**: 
   - Is there a clear "Freedom to Operate"? 
   - Are there obvious patent thickets or "IP landmines" in this industry (e.g., Fintech, Biotech, AI infrastructure)?
   - What is the defendability of the core IP?
2. **Regulatory Minefield**: 
   - List the 3-5 most critical regulatory frameworks this startup MUST navigate (e.g., SOC2, GDPR, HIPAA, FINRA, FDA).
   - Rate the "Regulatory Friction" from 1-10 (1 = Low, 10 = Existential/High Barrier).
3. **The Compliance Moat**: 
   - Can regulatory compliance be turned into a competitive moat/barrier to entry?

FORMAT:
Return a JSON object:
{
  "ipScore": 85,
  "regulatoryFriction": 4,
  "keyLandmines": [
    { "type": "IP/Legal", "risk": "...", "severity": "High" }
  ],
  "requiredCompliances": [
    { "framework": "...", "priority": "CRITICAL", "timeline": "Pre-launch/Post-MVP" }
  ],
  "complianceMoatStrategy": "How to use these hurdles to block competitors."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are an IP Attorney and Regulatory Consultant for Tier-1 Venture Capital firms.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
