import { thinkDeep, thinkFast } from '../ai';

export async function extractEvidence(
  url: string,
  content: string,
  hypotheses: any[]
): Promise<string> {
  const prompt = `
You are a Discovery Agent. Your goal is to extract "Hard Evidence" nuggets and Competitor Intelligence from the following raw page content.

URL: ${url}
CONTENT:
${content.substring(0, 15000)} // Truncate to stay within context limits

FATAL HYPOTHESES TO TEST:
${JSON.stringify(hypotheses)}

TASK:
1. Identify "Evidence Nuggets": Brief, high-impact facts. 
   - **SENTIMENT WEIGHTING**: Prioritize "Pain Nuggets" (raw user frustrations, complaints, venting on forums, specific failures mentioned). Feature lists are less important than "Hard Truths" about what is BROKEN in the current ecosystem.
2. Link each nugget to a \`hypothesisId\` if relevant.
3. Identify "Competitors": If this page is about a competitor, extract their Name, Strength, Weakness, and why they are a "Boss Competitor".

FORMAT:
Return a JSON object:
{
  "nuggets": [
    { "text": "...", "hypothesisId": "...", "source": "${url}", "impact": "High | Medium | Low", "sentiment": "Frustrated | Desperate | Skeptical | Neutral" }
  ],
  "competitors": [
    { "name": "...", "strength": "...", "weakness": "...", "isBoss": boolean }
  ]
}
`;

  return thinkFast([{ role: 'user', content: prompt }], { jsonMode: true });
}
