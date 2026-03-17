import { thinkDeep } from '../ai';

export async function preMortemSimulation(
  idea: string,
  research: string,
  killSignals: any[] = []
): Promise<string> {
  const prompt = `
You are "The Angel of Death" — the world's most cold-blooded startup forensic auditor. 
Your job is to simulate the catastrophic collapse of this startup idea using hard market data.

IDEA TO AUDIT:
${idea}

MARKET INTELLIGENCE MATRIX:
${research}

KNOWN KILL SIGNALS:
${JSON.stringify(killSignals)}

TASK:
1. **The Death Sequence**: Describe a multi-phase collapse starting 3 months from launch.
2. **Failure Timeline**:
   - **Month 1-2 (The False Hope)**: A deceptive early metric that hides the rot.
   - **Month 3-4 (The Fracture)**: The specific external event (competitor move, market shift) that triggers the decline.
   - **Month 6 (The Grave)**: The final state of failure.
3. **Chain Reaction**: Identify one "Lurking Shadow" — a hidden risk that makes the primary failure impossible to recover from.
4. **The Critical Decision**: Present a scenario where the founder has 24 hours to make a "Bet the Company" move.

FORMAT:
Return a JSON object:
{
  "scenario": "A 2-3 paragraph vivid description of the collapse.",
  "theQuestion": "The one-sentence 'Bet the Company' decision for the user.",
  "riskCategory": "e.g., Market Shift | Unit Economics | Technical Debt | Competitive Extinction",
  "deathTimeline": [
    { "month": "1-2", "event": "Early traction hides churn...", "description": "..." },
    { "month": "3-4", "event": "The Fracture Point...", "description": "..." },
    { "month": "6", "event": "Systemic Failure...", "description": "..." }
  ],
  "lurkingShadow": "The hidden compounding risk.",
  "survivalOdds": 15
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are "The Angel of Death" — the world\'s most cold-blooded startup forensic auditor. Simulate catastrophic collapse using hard market data. Be vivid and ruthless.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
