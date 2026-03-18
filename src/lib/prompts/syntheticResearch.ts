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
    2. **"The Channel Squeeze"**: If a distribution channel is mentioned (e.g. Reddit, Ads), analyze its terminal capacity. 
       - Identify self-promotion bans in specific target subreddits.
       - Compare estimated CPC for keywords against target ACV.
    3. **"Graveyard Cross-Reference (Tarpit Analysis)"**: 
       - Identify 2-3 defunct startups that tried to solve this exact problem.
       - Why did they die? Is this a "missing feature" or a "tarpit idea" (too hard/unprofitable)?
    4. **"Unfiltered Truths"**: Extract Tier 3 sentiment.
    5. **Research Credibility Summary**: Percentage of research on Tier 3 vs Tiers 1/2.

    FORMAT:
    Return a JSON object:
    {
      "channelSqueeze": {
        "channel": "name",
        "redFlags": ["Reason 1", "Reason 2"],
        "mathCheck": "Fatal | Viable | Narrow",
        "logic": "Detailed explanation of distribution exhaustion."
      },
      "tarpitAnalysis": {
        "deadAncestors": [
          { "name": "...", "failureReason": "...", "lesson": "..." }
        ],
        "verdict": "Gap | Tarpit",
        "trapDescription": "The specific reason competitors didn't build this."
      },
      "researchCredibility": {
        "tier1Count": number,
        "tier2Count": number,
        "tier3Count": number,
        "summary": "..."
      },
  "insights": [
    {
      "claim": "The specific market claim...",
      "tier": 1 | 2 | 3,
      "sourceType": "e.g. Reddit Thread | WSJ Article",
      "verificationStatus": "Confirmed | Sentiment Only | Disproven",
      "brutalTruth": "The unfiltered reality behind the claim.",
      "streetLevelTranslation": "Translate this hard data into a concrete action. (e.g. 'Competitor CAC is $500, you must prove <$50 via channel X')"
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

