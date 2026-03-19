import { think } from '../ai';

export async function rescoreWithEvidence(idea: string, originalAudit: string, evidenceLog: string): Promise<string> {
  const prompt = `
You are the Lead Auditor reviewing new evidence submitted by a founder.
You previously audited their idea and gave them a score and a verdict.
They have now run tests and submitted STRUCTURED field evidence.

ORIGINAL IDEA:
${idea}

ORIGINAL AUDIT RESULT:
${originalAudit}

NEW STRUCTURED EVIDENCE LOG (each entry has a type and content):
${evidenceLog}

EVIDENCE TYPE WEIGHTS:
- "Revenue Data" = strongest signal (actual money changing hands)
- "Signup Metric" = strong signal (measurable interest)
- "Interview Quote" = moderate signal (qualitative but useful)
- "Survey Result" = weak-moderate signal (self-reported, often biased)
- "Rejection Signal" = negative signal (evidence AGAINST the assumption)
- "Other" = context-dependent

TASK:
1. Review each piece of evidence against the Critical Assumption Stack.
2. Score EACH assumption's remaining risk on a 0-100 confidence scale (100 = fully validated, 0 = completely unvalidated).
3. Determine if the aggregate evidence is strong enough to change the verdict.
4. Be brutally honest — vanity metrics and self-reported surveys should NOT flip a verdict.

OUTPUT JSON FORMAT:
{
  "newVerdict": "Greenlit for Testing" | "Pivot Required" | "Indicted",
  "evidenceAnalysis": "Brutal critique of their evidence. Is it just vanity metrics or hard proof?",
  "updatedCoreBet": "The newly refined core wager of this business based on evidence.",
  "confidencePerAssumption": [
    {
      "assumption": "The assumption text",
      "confidence": 72,
      "reasoning": "One sentence on why this confidence level."
    }
  ],
  "updatedAssumptions": [
    "Remaining assumption 1",
    "Remaining assumption 2"
  ]
}
`;

  return think(prompt, "RescoreEngine");
}
