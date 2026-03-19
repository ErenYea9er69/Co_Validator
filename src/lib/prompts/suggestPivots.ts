import { think } from '../ai';

export async function suggestPivots(ideaStr: string, auditSummaryStr: string): Promise<string> {
  const prompt = `
You are a strategic YC Partner helping a founder whose original idea just got destroyed in an audit.
Based on their original idea and the core bottlenecks identified in the audit, suggest 3 distinct, highly-viable PIVOT directions.

ORIGINAL IDEA:
${ideaStr}

AUDIT BOTTLENECK:
${auditSummaryStr}

TASK:
Generate 3 distinct pivot options. For example, if B2C is too hard, suggest a B2B pivot. If SaaS is too crowded, suggest a tech-enabled service.

OUTPUT JSON FORMAT:
{
  "pivots": [
    {
      "name": "Short, catchy name for this pivot direction (e.g., 'The Enterprise Upmarket Pivot')",
      "rationale": "One sentence explaining why this solves the audit's bottleneck.",
      "variables": {
        "audience": "New target audience",
        "pricing": "New pricing strategy",
        "channel": "New primary acquisition channel",
        "problemReframe": "How the problem is tweaked",
        "revenueModel": "New monetization approach"
      }
    }
  ]
}
`;

  return think(prompt, "PivotGenerator");
}
