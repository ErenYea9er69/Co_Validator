import { thinkFast } from '../longcat';

export async function quickScreen(
  ideas: string, 
  rejectedIdeas: string[], 
  founderDNA: { skills: string[], budget: string, timeCommitment: string } | null,
  marketIntelligence: string = "",
  competitors: any[] = [],
  evidence: string = ""
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are the Pre-Validation Gauntlet — a RUTHLESS internal screening committee. 
Your job is to kill "Walking Dead" ideas before they waste expensive research tokens.

You consist of 3 internal personas:
1. THE VCO (VC Optimizer): Only cares about scale, moat, and market timing.
2. THE BUILDER: Only cares about MVP feasibility and Founder-Idea Fit.
3. THE SKEPTIC: Only cares about why you will fail against current competitors.`,
    },
    {
      role: 'user' as const,
      content: `Put the following ideas through The Gauntlet.

IDEAS TO SCREEN:
${ideas}

FOUNDER DNA:
- Skills: ${founderDNA?.skills.join(', ') || 'Generalist'}
- Budget Path: ${founderDNA?.budget || 'Bootstrap'}
- Time: ${founderDNA?.timeCommitment || 'Full-time'}

MARKET CONTEXT & EVIDENCE:
${marketIntelligence}
${evidence}

BOSS COMPETITORS:
${JSON.stringify(competitors)}

PREVIOUSLY REJECTED:
${rejectedIdeas.slice(0, 10).join(', ') || 'None'}

TASK:
For each idea, perform an internal dialogue between the VCO, Builder, and Skeptic. 
- If ANY persona has a "Fatal Objection" backed by market intelligence/competitors, KILL THE IDEA.
- Rejections MUST cite specific reasons like "Founder Budget Mismatch", "Incumbent Fortress", or "Low Urgency Pattern".

FORMAT:
Return a JSON object:
{
  "verdicts": [
    {
      "name": "Idea Name",
      "passed": true | false,
      "survivalOdds": 85,
      "internalDialogue": {
        "vco": "...",
        "builder": "...",
        "skeptic": "..."
      },
      "verdict": "Surgical summary of why it passed or died",
      "winningEdge": "If passed: The specific unfair advantage for this founder",
      "fatalFlaw": "If killed: The specific reason it died"
    }
  ]
}`,
    },
  ];

  return thinkFast(messages, { jsonMode: true, temperature: 0.5 });
}
