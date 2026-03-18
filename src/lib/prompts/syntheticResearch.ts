import { thinkDeep } from '../ai';

export async function syntheticResearch(
  idea: string,
  rawScrapedData: string
): Promise<string> {
  const prompt = `
You are a "Strategic Intelligence Officer". Your job is to classify raw web data into a 3-tier credibility framework.

TIER SYSTEM:
- **Tier 1 (Verified/Hard)**: SEC filings, official court records, verified founder post-mortems, company financial reports.
- **Tier 2 (Analytical/Pro)**: Gartner/Forrester reports, credible tech journalism (TechCrunch, WSJ), specialized industry whitepapers.
- **Tier 3 (Market Sentiment)**: Reddit, G2, Indie Hackers, Twitter, Trustpilot. (Valuable for "unfiltered truths" but not "confirmed data").

IDEA:
${idea}

RAW SCRAPED DATA:
${rawScrapedData}

TASK:
1. **Source Tiering**: Categorize the provided data into the 3 Tiers.
2. **"Unfiltered Truths"**: Extract insights from Tier 3, but explicitly flag them as "SENTIMENT".
3. **"Hard Counter-Evidence"**: Find any Tier 1 or Tier 2 data that contradicts the founder's assumptions.
4. **Research Credibility Summary**: What percentage of this audit's research rests on Tier 3 vs Tiers 1/2?

FORMAT:
Return a JSON object:
{
  "researchCredibility": {
    "tier1Count": number,
    "tier2Count": number,
    "tier3Count": number,
    "summary": "e.g. 'Highly speculative; 90% forum sentiment'"
  },
  "insights": [
    {
      "claim": "The specific market claim...",
      "tier": 1 | 2 | 3,
      "sourceType": "e.g. Reddit Thread | WSJ Article",
      "verificationStatus": "Confirmed | Sentiment Only | Disproven",
      "brutalTruth": "The unfiltered reality behind the claim."
    }
  ],
  "interviewTranscripts": [
    {
      "persona": "The Skeptic | The Pro User",
      "dialogue": [
        { "speaker": "Founder", "text": "..." },
        { "speaker": "Customer", "text": "..." }
      ],
      "keyNugget": "Specific insight gained."
    }
  ]
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a Strategic Intelligence Officer specialized in distinguishing high-signal data from market noise. You value Tier 1 evidence above all else.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}

