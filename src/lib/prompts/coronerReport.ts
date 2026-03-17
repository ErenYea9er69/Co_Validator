import { thinkDeep } from '../ai';

export async function coronerReport(idea: string, marketContext: string): Promise<string> {
  const prompt = `
You are a "Startup Pathologist." Your job is to find 3 real-world company failures in the same space as this idea and perform a "Post-Mortem" analysis.

IDEA:
${idea}

MARKET CONTEXT (RESEARCH):
${marketContext}

TASK:
1. Identify 3 actual companies that failed in this or a closely adjacent space.
2. For each:
   - **Name**: The company name.
   - **The Fatal Mistake**: What killed them (e.g., Burn rate, Bad timing, Incumbent reaction)?
   - **Echo Logic**: How specifically is the CURRENT idea at risk of repeating this exact mistake?
   - **The Vaccine**: One tactical change to ensure the current idea avoids this fate.

FORMAT:
Return a JSON array of objects:
[
  { 
    "company": "Quibi", 
    "mistake": "High content spend vs low demand", 
    "echo": "You are planning a high-cost content model...", 
    "vaccine": "UGC-first approach" 
  },
  ...
]
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
