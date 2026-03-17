import { thinkDeep } from '../ai';

export async function validateCompetitors(idea: string, research: string): Promise<string> {
  const prompt = `
You are the "Competitive Intelligence Officer." Your job is to find the hidden "Boss Competitors" that will crush this idea if it scales.

IDEA:
${idea}

MARKET RESEARCH:
${research}

TASK:
1. **Saturation Audit**: Is the market genuinely open or secretly "Red Ocean"?
2. **Boss Detection**: Identify the #1 competitor that owns the mindshare of the target buyer.
3. **Signal Detection**: Green flags (competitor weakness) and Red flags (competitor dominance).
4. **Confidence Score**: 0-100.

FORMAT:
Return a JSON object:
{
  "expert": "Competitive Intelligence Officer",
  "confidenceScore": 90,
  "verdict": "Open Field | Hidden Red Ocean | Competitive Graveyard",
  "directCompetitors": [
    { "name": "Competitor X", "marketShare": "High/Med/Low", "moat": "Their strength", "weakness": "Their vulnerability" }
  ],
  "reasoning": "Strategic competitive audit explaining the landscape and the boss competitors."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
