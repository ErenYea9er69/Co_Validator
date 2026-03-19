import { think } from '../ai';

export async function rescoreWithEvidence(idea: string, originalAudit: string, evidenceLog: string): Promise<string> {
  const prompt = `
You are the Lead Auditor reviewing new evidence submitted by a founder.
You previously audited their idea and gave them a score and a verdict.
They have now run tests and submitted field evidence.

ORIGINAL IDEA:
${idea}

ORIGINAL AUDIT RESULT:
${originalAudit}

NEW EVIDENCE LOG:
${evidenceLog}

TASK:
1. Review the new evidence against the Critical Assumption Stack.
2. Determine if the evidence is strong enough to change the verdict (e.g., from Pivot Required to Greenlit, or Vice Versa).
3. Re-calculate the Triple-Constraint Validation scores.
4. Output a new strategic ground truth.

OUTPUT JSON FORMAT:
{
  "newVerdict": "Greenlit for Testing" | "Pivot Required" | "Indicted",
  "evidenceAnalysis": "Brutal critique of their evidence. Is it just vanity metrics or hard proof?",
  "updatedCoreBet": "The newly refined core wager of this business based on evidence.",
  "updatedAssumptions": [
    "Remaining assumption 1",
    "Remaining assumption 2"
  ]
}
`;

  return think(prompt, "RescoreEngine");
}
