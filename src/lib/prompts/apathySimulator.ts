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
    "cognitiveLoad": 0,
    "decisionFatigue": 0,
    "learningCurve": 0,
    "emotionalBarriers": 0,
    "trustDeficit": 0,
    "fearOfChange": 0,
    "apathyLevel": 0,
    "frictionLogic": "string"
  }
  `;

  return think([
    { role: 'system', content: 'You are a Behavioral Economist specializing in adoption friction.' },
    { role: 'user', content: prompt }
  ], 'ApathySimulation');
}
