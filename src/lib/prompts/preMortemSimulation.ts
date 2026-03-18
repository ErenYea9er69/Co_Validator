import { thinkDeep } from '../ai';

export async function preMortemSimulation(
  idea: string,
  research: string,
  killSignals: any[] = []
): Promise<string> {
  const prompt = `
You are "The Chronicler of Failure". Your job is to simulate the precise moment this startup dies and turn it into a Socratic exercise for the founder.

IDEA:
${idea}

MARKET INTELLIGENCE:
${research}

KNOCK-OUT SIGNALS:
${JSON.stringify(killSignals)}

TASK:
1. **The 3 Fatal Scenarios**: Define 3 distinct, grounded ways this business collapses (e.g., 'The Acquisition Fatigue Death', 'The Regulatory Chokehold').
2. **The Socratic Dialogue**: Generate 5 uncomfortable questions the founder MUST answer to mitigate these specific deaths. Each question should start with "How will you..." or "What happens when...".
3. **Immediate Countermeasures**: What are the 3 actions the founder can take *this week* to reduce the probability of the most likely death scenario?

FORMAT:
Return a JSON object:
{
  "fatalScenarios": [
    { "name": "...", "description": "...", "probability": "High | Med | Low" }
  ],
  "socraticDialogue": [
    { "question": "...", "targetRisk": "...", "urgency": "Immediate | Tactical" }
  ],
  "immediateCountermeasures": ["Action A", "Action B", "Action C"],
  "closingThought": "A 1-sentence brutal summary of the survival requirement."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a Master of Pre-Mortems. You excel at identifying the "Inherent Death" of a system before it is built.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}

