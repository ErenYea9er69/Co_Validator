import { thinkDeep, thinkFast } from '../ai';

export async function generateIdeas(
  marketIntelligence: string,
  rejectedIdeas: string[],
  founderProfile: string,
  customCriteria?: string,
  competitors: any[] = []
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a Master Startup Architect at a top-tier venture studio.
Your goal is to forge high-stakes startup ideas that aren't just "cool" but are surgically designed for the current market gaps and the specific DNA of the founder.`,
    },
    {
      role: 'user' as const,
      content: `Forge 3-5 high-fidelity startup opportunities based on the provided intelligence.

MARKET INTELLIGENCE (MATRIX):
${marketIntelligence}

BOSS COMPETITORS SPOTTED:
${JSON.stringify(competitors)}

FOUNDER DNA PROFILE:
${founderProfile}

${customCriteria ? `CUSTOM STRATEGIC CONSTRAINTS: ${customCriteria}` : ''}

DO NOT suggest any previously rejected concepts:
${rejectedIdeas.length > 0 ? rejectedIdeas.join('\n') : 'None yet'}

TASK:
1. **Assign Archetype**: Every idea must fit one profile:
   - "The Specialist" (Deep niche vertical SaaS)
   - "The Efficiency Play" (Workflow automation/optimization)
   - "The Disruptor" (Attacking a bloated incumbent)
   - "The Infrastructure Bet" (Building the 'shovels' for a trend)
2. **MOAT-FIRST DESIGN**: Instead of starting with a generic solution, you MUST build every idea around a specific research-backed "Unfair Advantage" or "Data Moat" derived from the high-signal findings in the Market Intelligence.
3. **DNA Match Score**: Score (0-100) based on how well this idea fits the founder's skills, budget, and bio.
4. **The Secret Sauce**: Explicitly define the differentiation against the Boss Competitors listed above.
5. **The Anti-Pitch**: What MUST this product NOT do/be to stay lean and focused.
6. **Fastest Path to $1k/mo**: A specific, non-generic outbound/GTM strategy.

FORMAT:
Return a JSON object:
{
  "ideas": [
    {
      "name": "...",
      "archetype": "Specialist | Efficiency | Disruptor | Infrastructure",
      "dnaMatchScore": 92,
      "whyDnaMatch": "...",
      "problem": "...",
      "solution": "...",
      "secretSauce": "How we win against competitors",
      "antiPitch": "What we are NOT building",
      "fastestPathToRevenue": "Step-by-step GTM",
      "mvpScope": "Extreme mvp focus",
      "biggestRisk": "..."
    }
  ]
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.8, maxTokens: 8192 });
}
