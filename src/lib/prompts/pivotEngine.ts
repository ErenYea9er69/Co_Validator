import { think } from '../ai';

export async function pivotEngine(idea: string, failures: string, token?: string): Promise<string> {
  const prompt = `
You are the "Strategic Pivot Master." Your job is to rescue a failing idea by finding its high-potential neighbor.

IDEA:
${idea}

WHY IT IS FAILING (STRESS TEST RESULTS):
${failures}

TASK:
Generate 3 distinct "Adjacent Pivots."
For each pivot:
1. **Name**: Catchy new name.
2. **The Shift**: What are we changing (Market, Product, or Model)?
3. **The Logic**: Why does this solve the fatal flaw of the original idea?
4. **Market Opportunity**: The new "White Space" we are entering.

FORMAT:
Return a JSON object:
{
  "pivots": [
    { "name": "Pivot A", "shift": "B2C to B2B", "logic": "Higher LTV...", "opportunity": "Enterprise gap" },
    ...
  ]
}
`;

  return think([
    { role: 'system', content: 'You are a master "Pivot Architect" specialized in saving startups from the Tarpit.' },
    { role: 'user', content: prompt }
  ], 'PivotEngine');
}
