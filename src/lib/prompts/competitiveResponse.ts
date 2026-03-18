import { thinkDeep } from '../ai';

export async function competitiveResponse(
  idea: string,
  competitorResearch: string
): Promise<string> {
  const prompt = `
You are a "Game Theory & Market Retaliation Specialist". Your job is to simulate how incumbents and aggressive startups will react the moment this business starts gaining traction.

IDEA:
${idea}

COMPETITOR RESEARCH:
${competitorResearch}

TASK:
1. **The Retaliation Playbook**: Identify the 3 most likely moves an incumbent (e.g., Google, Amazon, or a segment leader) will make to kill this startup (e.g., 'Feature Parity Wipeout', 'Platform Locking', 'Predatory Pricing').
2. **The "Silent Killer"**: Identify a non-obvious competitor (maybe in a different vertical) who has the data/distribution to pivot and crush this idea in 90 days.
3. **The Poison Pill**: What is the "Poison Pill" this startup can implement to make retaliation too expensive or difficult for incumbents?

FORMAT:
Return a JSON object:
{
  "retaliationMoves": [
    { "competitor": "...", "move": "...", "probability": "High | Med | Low", "lethality": "Fatal | Severe | Nuisance" }
  ],
  "silentKiller": {
    "name": "...",
    "pivotLogic": "How they would pivot to compete.",
    "threatLevel": "Critical | High"
  },
  "poisonPill": "Strategic move to deter incumbents.",
  "competitiveMoat": "Summary of the final defensive posture."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a master of competitive strategy and market dynamics. You think 3 steps ahead of the competition.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
