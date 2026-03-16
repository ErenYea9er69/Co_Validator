import { thinkDeep } from '../ai';

export async function synthesizeResearch(
  searchResults: string,
  evidence: string = "",
  competitors: any[] = []
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a Lead Market Architect. Your goal is to synthesize raw data into a strategic "Intelligence Matrix".
You must weigh evidence found in deep scrapes against competitive density to identify the "Golden Path" or trigger a "Kill Signal".`,
    },
    {
      role: 'user' as const,
      content: `Synthesize the following research data into a high-stakes market intelligence report.

RAW SEARCH SUMMARY:
${searchResults}

DEEP EVIDENCE NUGGETS:
${evidence}

COMPETITOR DOSSIERS:
${JSON.stringify(competitors)}

TASK:
1. **Opportunity Matrix**: Identify 3-4 distinct market gaps. 
   - **GAP INTENSITY SCORE**: Calculate a numerical score based on (User Frustration Frequency + Alternative Clumsiness) / (Ease of Entry).
2. **Evidence Linking**: Explicitly cite evidence strings that back up each gap.
3. **COUNTER-EVIDENCE MAPPING**: For every gap identified, you MUST find and list 2 data points that *disprove* the opportunity or highlight a structural risk.
4. **Kill Signals**: Identify any "Hard Rejection" reasons found (e.g., "Google just launched this", "X startup already raised $50M to solve this").
5. **Pivot Direction**: If the current path is high-risk, suggest the single most promising "Adjacent Pivot".

FORMAT:
Return a JSON object:
{
  "matrix": [
    {
      "gap": "Title",
      "depth": "Detailed description",
      "gapIntensityScore": 9.2, 
      "painFrequency": "High | Medium | Low",
      "clumsinessOfAlternatives": "Catastrophic | Annoying | Efficient",
      "supportingEvidence": ["..."],
      "counterEvidence": ["..."],
      "strategicAngle": "How to attack this gap"
    }
  ],
  "killSignals": [
    { "reason": "...", "threatLevel": "Critical | Warning", "source": "..." }
  ],
  "topInsight": "The single most surgical finding",
  "pivotIndicator": { "direction": "...", "why": "..." }
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.5 });
}
