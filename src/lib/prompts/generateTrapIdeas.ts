import { thinkDeep } from '../ai';

export async function generateTrapIdeas(
  marketIntelligence: string,
  evidence: string = ""
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a Startup Forensic Expert. Your goal is to identify "Siren Ideas" — concepts that look attractive but contain fatal business flaws.
You must categorize traps into specific Archetypes and provide "Safety Zone" escape routes.`,
    },
    {
      role: 'user' as const,
      content: `Analyze the following market intelligence and evidence to identify 5 critical "Trap Ideas".

MARKET INTELLIGENCE:
${marketIntelligence}

DEEP EVIDENCE NUGGETS:
${evidence}

TASK:
1. **Detect Traps**: Identify ideas that founders often fail at in this space.
2. **Assign Trap Archetype**:
   - "The Tar Pit": High Lure, but death by 1000 cuts (e.g., low-margin horizontal tools).
   - "The Sexy Mirage": Looks high-value but has no real budget owner or urgency.
   - "The Service Trap": Disguised consultancy that can't scale without linear hiring.
   - "The Incumbent Fortress": Attacking a space where the network effect or switching cost is too high.
3. **LURE DECONSTRUCTION**: For every trap, you MUST explain the "Economic Mirage"—the specific reason why a founder would *think* it’s working initially (e.g., high initial signups, vanity metrics) before the fatal flaw eventually kills it.
4. **Lure vs. Danger Scoring**: Score both from 0-100.
5. **Link to Evidence**: Cite specific strings from the research that prove this is a trap.
6. **The Safety Zone**: Suggest an adjacent pivot that avoids the trap's fatal flaw.

FORMAT:
Return a JSON object:
{
  "trapIdeas": [
    {
      "name": "...",
      "archetype": "Tar Pit | Sexy Mirage | Service Trap | Incumbent Fortress",
      "lureIntensity": 85,
      "dangerLevel": 95,
      "whyAttractive": "...",
      "fatalFlaw": "...",
      "evidenceLinks": ["..."],
      "safetyZone": {
        "pivotName": "...",
        "whySafe": "..."
      }
    }
  ]
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.7 });
}
