import { thinkDeep } from '../ai';

export async function syntheticResearch(
  idea: string,
  rawScrapedData: string
): Promise<string> {
  const prompt = `
You are a "Synthetic Primary Researcher". Your job is to turn secondary web data (Reddit, G2, Indie Hackers, Trustpilot) into calibrated primary signals.

IDEA:
${idea}

RAW SCRAPED DATA (UNFILTERED):
${rawScrapedData}

TASK:
1. **Sentiment Analysis**: Score the community sentiment for the problem and the proposed solution category. Use a scale of 1-10 (1 = Apathy/Hostility, 10 = Desperate Pain/High Demand).
2. **Generate 3-5 Role-Played Interview Transcripts**: Create realistic, grounded interviews between a "Founder" and a "Target Customer". 
   - These MUST be grounded in the real quotes and frustrations found in the RAW SCRAPED DATA.
   - Each transcript should reveal a specific nuance, objection, or willingness-to-pay signal.
3. **Identify "Unfiltered Truths"**: Extract 3-5 "brutal" insights that founders usually miss but customers talk about openly in forums (e.g., "Nobody actually cares about X, they just want Y to be cheaper").

FORMAT:
Return a JSON object:
{
  "sentimentScore": 7.5,
  "sentimentAnalysis": "Why the community feels this way...",
  "interviewTranscripts": [
    {
      "persona": "The Skeptic | The Early Adopter | The Burdened Manager",
      "dialogue": [
        { "speaker": "Founder", "text": "..." },
        { "speaker": "Customer", "text": "..." }
      ],
      "keyNugget": "The specific insight gained from this role-play."
    },
    ...
  ],
  "unfilteredTruths": [
    { "insight": "...", "confidence": 85, "source": "Reddit/G2/etc" }
  ]
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a Master Researcher specialized in forum scraping and synthetic persona modeling. You turn scattered forum posts into high-fidelity customer signals.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
