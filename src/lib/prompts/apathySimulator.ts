import { think } from '../ai';

export async function apathySimulator(idea: string, researchSummary: string): Promise<string> {
  const prompt = `
  You are the "Consumer Psychology Engine". Simulate the buyer's apathy and friction.

  IDEA:
  ${idea}

  RESEARCH SUMMARY:
  ${researchSummary}

  FORMAT:
  Return JSON:
  {
    "apathyScore": 0,
    "indifferenceArgument": "string",
    "switchingCost": "string",
    "brutalTruth": "string",
    "psychologicalFriction": [
      {
        "point": "string",
        "severity": "High | Medium",
        "reason": "string"
      }
    ],
    "empiricalTest": {
      "proposition": "string",
      "threshold": "string"
    },
    "cognitiveLoad": "string",
    "decisionFatigue": "string",
    "learningCurve": "string",
    "emotionalBarriers": "string",
    "trustDeficit": "string",
    "fearOfChange": "string"
  }
  `;

  return think([
    { role: 'system', content: 'You are a Behavioral Economist specializing in adoption friction.' },
    { role: 'user', content: prompt }
  ], 'ApathySimulation');
}
