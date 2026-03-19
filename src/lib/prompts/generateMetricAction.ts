import { think } from '../ai';

export async function generateMetricAction(metricTitle: string, userScore: number, reasoning: string, industry: string): Promise<string> {
  const prompt = `
You are a YC Partner advising a founder who just scored poorly on a specific metric in their startup audit.
They need ONE highly actionable, concrete sentence on how to improve this score over the next 7 days.

INDUSTRY: ${industry}
METRIC: ${metricTitle}
CURRENT SCORE: ${userScore}/100
WHY THEY SUCKED: ${reasoning}

TASK:
Give them the single most impactful action they can take immediately to fix this specific weakness.
Do NOT give generic advice like "talk to users".
Do give specific plays like "To raise your Moat score: Implement data network effects by storing user-generated content that compounds in value so switching costs artificially increase."

OUTPUT JSON FORMAT:
{
  "actionableAdvice": "Your brutal, 1-sentence tactical advice."
}
`;

  return think(prompt, "MetricAdvice");
}
