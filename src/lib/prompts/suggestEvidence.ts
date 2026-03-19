import { think } from '../ai';

export async function suggestNextEvidence(assumptionGroup: any, recentEvidence: any[]): Promise<string> {
  const prompt = `
You are the Lead Auditor advising a founder on exactly how to validate a specific critical assumption.
The founder has collected some evidence so far, but needs to know the BEST next step.

THE ASSUMPTION TO PROVE: ${assumptionGroup.text}
CURRENT STATUS: ${assumptionGroup.status}
CONFIDENCE LEVEL: ${assumptionGroup.confidence}/100

EVIDENCE GATHERED SO FAR:
${recentEvidence.map((e, i) => `${i + 1}. [${e.type}] ${e.text} (Date: ${e.date})`).join('\n') || 'None'}

TASK:
Review what they have done (if anything). What is the highest-signal, most brutal test they should run NEXT to prove or disprove this assumption once and for all? Focus on getting them out of the building.

OUTPUT JSON FORMAT:
{
  "nextBestTest": "A concrete 1-2 sentence description of the exact test they should run (e.g., 'Run a $50 Facebook ad to a landing page to test click-through rates').",
  "whyItMatters": "One sentence explaining why this test provides stronger validation than surveys or interviews."
}
`;

  return think(prompt, "EvidenceSuggester");
}
