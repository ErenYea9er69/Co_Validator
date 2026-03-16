import { thinkDeep } from '../longcat';

export async function generateBlueprint(
  idea: { name: string, problem: string, solution: string, competitors?: string, monetization?: string },
  founderDNA: { skills: string[], budget: string, timeCommitment: string } | null
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are the "Master Startup Architect." Your goal is to take a raw, manual startup idea and "blueprint" it into a high-fidelity concept.
      You expand the user's basic thoughts into a sophisticated business model, while also providing a "Mirror Roast" to highlight immediate blind spots.`,
    },
    {
      role: 'user' as const,
      content: `Transform this raw idea into a High-Fidelity Startup Blueprint.

RAW INPUT:
- Name: ${idea.name}
- Problem: ${idea.problem}
- Solution: ${idea.solution}
- Competitors: ${idea.competitors || 'None'}
- Monetization: ${idea.monetization || 'None'}

FOUNDER DNA:
- Skills: ${founderDNA?.skills.join(', ') || 'Generalist'}
- Budget: ${founderDNA?.budget || 'Bootstrap'}
- Time: ${founderDNA?.timeCommitment || 'Full-time'}

TASK:
1. **Refined Problem**: Expand the pain point. Who is the specific "Person in Pain"?
2. **High-Fidelity Solution**: Describe the "Magic Moment" of the product.
3. **Founder-Idea Fit (Founder Pulse)**: Score 0-100 based on DNA.
4. **The Mirror Roast**: 3 brutal bullets on why this will likely fail as currently conceived.
5. **The Secret Sauce**: Identify a potential unfair advantage or moat.

FORMAT:
Return a JSON object:
{
  "refinedIdea": {
    "name": "Upgraded Name",
    "problem": "Expanded, deep problem description",
    "solution": "High-fidelity solution description",
    "targetPersona": "Specific person/role in pain",
    "secretSauce": "The unique angle/moat"
  },
  "founderPulse": {
    "score": 85,
    "reasoning": "Why this matches/clashes with DNA",
    "pulseRate": "high | steady | low"
  },
  "mirrorRoast": [
    "Bullet 1: Brutal truth about market/competition",
    "Bullet 2: Brutal truth about execution risk",
    "Bullet 3: Brutal truth about monetization"
  ],
  "monetizationStrategy": "Refined revenue model"
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.7 });
}
