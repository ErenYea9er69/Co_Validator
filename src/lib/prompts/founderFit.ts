import { thinkDeep } from '../ai';

export async function founderFit(idea: string, founderDNA: any): Promise<string> {
  const prompt = `
You are a "Human Capital Analyst." Your job is to evaluate the "Psychological and Resource Fit" between the founder and the market complexity.

IDEA:
${idea}

FOUNDER DNA:
${JSON.stringify(founderDNA)}

TASK:
1. Evaluate the gap between the Founder's current skills/budget and the Industry's "Barrier to Entry."
2. **Alignment Score**: 0-100 (How likely is this founder to survive the first 12 months?).
3. **Burn Risk**: High/Med/Low (Probability of the founder quitting or running out of money before product-market fit).
4. **DNA Advantage**: What specific part of their background is the "Unfair Advantage"?
5. **Brutal Truth**: One sentence of "No-BS" advice about whether they are actually the right person for this specific fight.

FORMAT:
Return a JSON object:
{
  "alignmentScore": 85,
  "burnRisk": "Med",
  "dnaAdvantage": "Technical depth in domain X",
  "brutalTruth": "You have the tech but lack the sales stomach for this industry."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
