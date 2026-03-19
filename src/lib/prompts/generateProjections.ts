import { think } from '../ai';

export async function generateProjections(idea: string, marketData: string, confidence: number): Promise<string> {
  const prompt = `
You are the "Growth Forecaster." Your job is to simulate the next 12 months of this startup's life.

IDEA:
${idea}

MARKET/ECONOMICS DATA:
${marketData}

TASK:
Generate a month-by-month projection for 12 months.
Include:
1. **Users**: Cumulative active users.
2. **Revenue**: Monthly recurring revenue (MRR).
3. **Burn**: Monthly operational cost.
4. **Milestone**: A key achievement for that month.

FORMAT:
Return a JSON object:
{
  "summary": "Growth trajectory overview",
  "dataPoints": [
    { "month": 1, "users": 100, "revenue": 0, "burn": 2000, "milestone": "MVP Launch" },
    ... up to month 12
  ]
}
`;

  const result = await think([{ role: 'user', content: prompt }], { jsonMode: true });
  return result.content;
}
