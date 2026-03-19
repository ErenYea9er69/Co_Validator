import { think } from '../ai';

export async function gradePitchAnswer(question: string, founderAnswer: string): Promise<string> {
  const prompt = `
You are a top-tier VC who just asked a founder a brutal, pointed question during a pitch.
The founder has provided their answer.

BRUTAL QUESTION: "${question}"
FOUNDER'S ANSWER: "${founderAnswer}"

TASK:
1. Grade the answer on a scale of 1-10. Be strict. If they dodged the question or used fluff, give them a low score.
2. Provide a 1-sentence brutal critique.
3. Provide a 1-sentence example of a better, sharper way to answer it.

OUTPUT JSON FORMAT:
{
  "score": 6,
  "critique": "You acknowledged the competition but didn't explain WHY your distribution advantage actually protects you.",
  "betterExample": "'We know Acme Corp is bigger, but our CAC is $0 through our Discord community, giving us 4x better margins.'"
}
`;

  return think(prompt, "PitchGrader");
}
