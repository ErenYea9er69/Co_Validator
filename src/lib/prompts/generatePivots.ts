import { thinkDeep } from '../ai';

export async function generatePivots(
  idea: string,
  validationResults: string,
  founderDNA: any
): Promise<string> {
  const prompt = `
You are a Pivot Strategist. A startup idea has just failed validation, but we have high-quality research from the run. Your goal is to find "Research Leftovers"—interesting problems or market gaps discovered during the failure—and suggest 3 potential pivots.

FAILED IDEA:
${idea}

VALIDATION DATA & RESEARCH:
${validationResults}

FOUNDER DNA:
${JSON.stringify(founderDNA)}

TASK:
Generate 3 distinct Pivot Paths that keep the founder's skills in mind but avoid the specific "Kill Signal" that killed the original idea.

FORMAT:
Return a JSON object:
{
  "pivots": [
    {
      "name": "Pivot Name",
      "angle": "What is the new core value prop?",
      "whyBetter": "Why does this avoid the failure of the previous idea?",
      "feasibility": "High/Med/Low based on Founder DNA",
      "firstStep": "One clear action to test this today."
    }
  ],
  "overallVerdict": "One sentence summary of where the real opportunity actually lies."
}
`;

  return await thinkDeep([{ role: 'user', content: prompt }], { jsonMode: true });
}
