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
    "blindSpots": [
      {
        "whatTheySaid": "The flawed conclusion in the Final Verdict...",
        "whyTheyAreWrong": "The data that contradicts it...",
        "severity": "Fatal Flaw | Minor Oversight"
      }
    ],
    "dissentingVerdict": "If your verdict differs from theirs, what is it? (e.g., They said Greenlit, you say Pivot).",
    "finalWarning": "A blunt warning to the founder about trusting the main report blindly."
  `;

  return think([
    { role: 'system', content: 'You are the contrarian partner at the Venture Capital firm who always votes NO, and you are usually right.' },
    { role: 'user', content: prompt }
  ], 'SecondOpinion');
}
