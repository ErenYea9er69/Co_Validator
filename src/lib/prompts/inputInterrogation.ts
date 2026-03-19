import { think } from '../ai';

export async function inputInterrogation(
  idea: string
): Promise<string> {
  const prompt = `
You are a Veteran VC Partner in a "Zero-Day" Founder Meeting. 
A human VC never accepts a one-paragraph "Problem" statement; they spend 30–45 minutes extracting quantifiable pain metrics, customer quotes, discovery process, and willingness-to-pay data before any analysis begins.

Current Idea Input:
${idea}

TASK:
1. **Analyze Specificity**: Evaluate the current input. Look for generic claims, lack of data, or "spreadsheet fantasy" assumptions.
2. **Assign Specificity Score**: Score the input from 0-100. 
   - < 30: "Surface level - High risk of garbage-in"
   - 30-75: "Thin - Needs more grounding"
   - > 75: "Audit Ready - Highly specific"
3. **Generate Interrogation Questions**: Generate 8-12 targeted, aggressive questions to extract:
   - **Quantifiable pain metrics**: Demand the "What is the dollar value of this pain?" (e.g., "Exactly how many hours per week does this waste?")
   - **Real customer proof**: "Provide the exact wording of the three most recent customer complaints or support tickets you've seen."
   - **Discovery details**: "How many people have you spoken to who AREN'T friends or family? What was their 'yes' moment?"
   - **Willingness-to-pay data**: "Prove they will pay. What is their current budget for a similar tool?"
   - **Counter-bias checks**: "If a founder says 'Gen Z gamers', push back: 'Which segment? Mobile or PC? What is their current average spend? Prove it.'"

FORMAT:
Return a JSON object:
{
  "specificityScore": 45,
  "readyForAudit": false, // true ONLY if specificityScore >= 75
  "feedback": "A brutal breakdown of why the current input is insufficient and where the founder is being delusional.",
  "interrogationSuite": [
    {
      "id": "q1",
      "question": "The specific, aggressive extraction question...",
      "targetMetric": "Quantifiable Pain | Customer Quote | Discovery Process | Economics",
      "context": "Why this specific detail matters for a VC-level audit."
    },
    ...
  ]
}
`;

  const result = await think([
    { role: 'system', content: 'You are an elite business analyst and interviewer.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
