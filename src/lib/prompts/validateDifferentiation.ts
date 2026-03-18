import { thinkDeep } from '../ai';

export async function validateDifferentiation(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Moat & Growth Strategist." Your job is to find the "Unfair Advantage" that prevents this startup from being cloned.

IDEA:
${idea}

RESEARCH:
${research}

TASK:
1. **Moat Audit**: Is there a structural defensibility (network effects, data moats, workflow lock-in)?
2. **Growth Vector**: How does this go from 1 to 1,000 customers without linear spend? Is the user's \`acquisitionChannel\` a commodity or an unfair advantage?
3. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Moat & Growth Strategist",
  "confidenceScore": 65,
  "verdict": "Unfair Advantage | Feature-Not-Product | Commodity Risk",
  "acquisitionFriction": "Critique of the scalability and defensibility of their chosen channel.",
  "primaryAdvantage": "SHORT PUNCHY ADVANTAGE NAME",
  "differentiationStrategy": "Detailed breakdown of the moat and how to defend it.",
  "signals": [
    { "type": "green", "text": "Workflow integration creates lock-in...", "impact": "High retention moat" },
    { "type": "red", "text": "Acquisition channel is easily saturated by incumbents...", "impact": "Growth risk" }
  ],
  "reasoning": "Growth and defensibility audit explaining the growth vector."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are the \"Moat & Growth Strategist.\" Your job is to find the \"Unfair Advantage\" that prevents this startup from being cloned. Identify structural defensibility and growth vectors.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
