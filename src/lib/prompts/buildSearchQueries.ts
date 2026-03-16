import { thinkDeep, thinkFast } from '../ai';

export async function buildSearchQueries(
  researchPlan: string,
  focusAreas: string[],
  pastFailures: string,
  hypotheses: any[] = []
): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const messages = [
    {
      role: 'system' as const,
      content: `You are a Search Matrix Architect. Your goal is to generate surgically targeted search queries using three distinct personas:
1. **The Anthropologist**: Searches for raw user pain, complaints, and "unfiltered" truth on Reddit, Twitter, and niche forums.
2. **The Analyst**: Searches for market data, competitor funding, enterprise pricing, and industry reports (use filetype:pdf/site:reports).
3. **The Hacker**: Searches for technical limitations, API weaknesses, "sunsetted" tools, and legacy software vulnerabilities.`,
    },
    {
      role: 'user' as const,
      content: `Generate 6-8 search queries derived from our Research Plan and Fatal Hypotheses.

RESEARCH PLAN:
${researchPlan}

FATAL HYPOTHESES:
${JSON.stringify(hypotheses)}

FOCUS AREAS: ${focusAreas.join(', ') || 'Open Market'}

TASK:
- Distribute queries across the 3 Personas (Anthropologist, Analyst, Hacker).
- Each query MUST link to one specific \`hypothesisId\` from our Fatal Hypotheses.
- Use advanced operators: site:, filetype:, intitle:, "exact match quotes".
- **TEMPORAL SENSITIVITY**: You must inject specific years (e.g. "${new Date().getFullYear()}", "${new Date().getFullYear() - 1}") or relative terms (e.g. "latest", "post-AI-surge", "stealth", "market shift") into at least 3 queries to force recent high-signal results.

FORMAT:
Return a JSON object:
{
  "queries": [
    {
      "query": "the actual query string",
      "persona": "Anthropologist | Analyst | Hacker",
      "targetHypothesisId": "h1 | h2 | h3",
      "rationale": "High-signal data we are hunting"
    }
  ]
}`,
    },
  ];

  return thinkFast(messages, { jsonMode: true, temperature: 0.8 });
}
