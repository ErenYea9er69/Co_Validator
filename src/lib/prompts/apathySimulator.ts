import { think } from '../ai';

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
    1. **The Indifference Argument**: Argue forcefully why it's easier and safer for the customer to do absolutely NOTHING.
    2. **Psychological Friction Points**: Identify 3 specific reasons why switching is mentally or operationally exhausting.
    3. **The "Friction Test" (MANDATORY ACTION)**: Generate a brutally simple, plain-text value proposition and a "Fake Door" challenge for the founder.
       - Challenge: "Get 10 people to give their email or click a link for THIS specific hook in 48 hours."
       - Explicitly state that algorithm-based apathy is a guess—this test is the truth.

    FORMAT:
    Return a JSON object:
    {
      "indifferenceArgument": "...",
      "psychologicalFriction": [
        { "point": "...", "reason": "...", "severity": "High | Med | Low" }
      ],
      "cognitiveLoad": "...",
      "decisionFatigue": "...",
      "learningCurve": "...",
      "emotionalBarriers": "...",
      "trustDeficit": "...",
      "fearOfChange": "...",
      "empiricalTest": {
        "proposition": "A 1-sentence plain text value prop.",
        "threshold": "e.g. 10 signups / 50 clicks",
        "logic": "Why this specific test resolves the apathy assumption."
      },
      "apathyScore": number,
      "switchingCost": "High | Med | Low",
      "brutalTruth": "..."
    }
`;

  const result = await think([
    { role: 'system', content: 'You are a Master of Apathy Simulation. You specialize in the "Default No" — the reason why customers won\'t even try a product.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
