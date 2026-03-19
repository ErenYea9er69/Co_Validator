import { think } from '../ai';

export async function founderBiasCalibrator(ideaStr: string, founderStr: string): Promise<string> {
  const prompt = `
  You are the "Cognitive Bias Calibrator". Your job is to psychoanalyze the founder's pitch and identify where they are lying to themselves.
  Founders inherently inflate traction, downplay competition, and assume their "unique insight" is completely novel.

  IDEA & CLAIMS:
  ${ideaStr}

  FOUNDER BACKGROUND & RESOURCES:
  ${founderStr}

  TASK:
  1. Detect Confirmation Bias: Is the founder actively ignoring an obvious flaw?
  2. Detect Dunning-Kruger Effect: Is a non-technical founder building a deep-tech product? Or a tech founder ignoring distribution?
  3. Traction Inflation: Estimate the discount rate that should be applied to their stated traction/waitlist.
  4. The "Comfortable Lie": What is the specific story the founder is telling themselves that will kill the company?

  FORMAT:
  Return a JSON object:
  {
    "detectedBiases": [
      {
        "biasType": "Name of Bias",
        "evidenceInPitch": "Where they showed this bias",
        "dangerLevel": "High | Medium | Low"
      }
    ],
    "tractionDiscount": "e.g., 'Discount waitlist by 90% due to lack of payment'",
    "theComfortableLie": "The specific delusion keeping them happy but doomed.",
    "calibrationScore": 0 // 0-100 where 100 is perfectly intellectually honest and 0 is completely delusional
  `;

  return think([
    { role: 'system', content: 'You are an adversarial psychoanalyst specializing in startup founder delusion and hubris.' },
    { role: 'user', content: prompt }
  ], 'FounderBiasCalibrator');
}
