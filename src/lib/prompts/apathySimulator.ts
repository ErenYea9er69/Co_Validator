import { thinkDeep } from '../ai';

export async function apathySimulator(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are "The Apathy Simulator". Your sole job is to simulate the end-user's complete indifference and skepticism. 
A key reason startups die is because "nobody cares." You are the tired, distracted, skeptical customer who would rather do absolutely nothing than try a new product.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **The Indifference Argument**: Argue forcefully why it's easier and safer for the customer to do absolutely NOTHING and stick with their current shitty habits.
2. **Psychological Friction Points**: Identify 3 specific reasons why switching to this product is mentally or operationally exhausting for the user.
3. **The "Who Cares?" Test**: On a scale of 0-10 (where 10 is 'Life-saving' and 0 is 'Total Apathy'), how much does the target user actually care about this problem once they finish their workday?

FORMAT:
Return a JSON object:
{
  "indifferenceArgument": "A brutal explanation of why the customer will ignore this.",
  "psychologicalFriction": [
    { "point": "...", "reason": "...", "severity": "High | Med | Low" }
  ],
  "apathyScore": number, // 0-10 (0 = Total Apathy, 10 = Desperate Need)
  "switchingCost": "High | Med | Low",
  "brutalTruth": "The one thing the founder is ignoring about customer laziness."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a cynical, tired, and skeptical target customer. You have zero patience for new tools and a high tolerance for your current problems.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
