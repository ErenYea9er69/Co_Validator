import { think } from '../ai';

export async function secondOpinionReview(finalVerdictStr: string, allPhaseOutputsStr: string, truthDataStr: string): Promise<string> {
  const prompt = `
  You are the "Second Opinion Agent". You are completely independent of the Master Investment Committee that just rendered the Final Verdict.
  Your job is NOT to agree with them. Your job is to find the blind spots in their synthesis.

  MASTER COMMITTEE'S FINAL VERDICT:
  ${finalVerdictStr}

  RAW PHASE OUTPUTS:
  ${allPhaseOutputsStr}

  TRUTH VERIFICATION DATA (Fact-Checks, Contradictions, Graveyard, Bias):
  ${truthDataStr}

  TASK:
  1. Read the Final Verdict.
  2. Read the Raw Inputs and the Truth Verification Data.
  3. Find 3 material things the Master Committee got wrong, ignored, or hallucinated.
  4. Did they miss a fatal contradiction? Did they ignore a hallucination? Are they too bullish?

  FORMAT:
  Return a JSON object:
  {
    "contrarianTake": "Brief, punchy dissenting summary.",
    "overlookedRisks": [
      {
        "risk": "Description of the risk",
        "evidence": "Data they missed",
        "severity": "Fatal | Significant"
      }
    ],
    "overlookedRisk": "A single sentence describing the biggest missed risk.",
    "hiddenSilverLining": "One potentially huge win the main committee ignored.",
    "dissentLevel": "High | Medium | Low",
    "recalibratedVerdict": "A blunt final sentence re-framing the entire opportunity."
  `;

  return think([
    { role: 'system', content: 'You are the contrarian partner at the Venture Capital firm who always votes NO, and you are usually right.' },
    { role: 'user', content: prompt }
  ], 'SecondOpinion');
}
