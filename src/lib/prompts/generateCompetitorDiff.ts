import { think } from '../ai';

export async function generateCompetitorDiff(competitorName: string, recentNews: string): Promise<string> {
  const prompt = `
You are a Competitive Intelligence Analyst for a VC firm. 
You are monitoring a specific competitor: ${competitorName}.
We just ran a live web search to find their most recent activity, news, feature launches, or pricing changes.

RAW RECENT SEARCH DATA:
${recentNews}

TASK:
1. Sift through the noise and identify any meaningful changes or threats to a new startup entering this space.
2. Did they launch a new feature? Raise money? Change pricing? Shut down?
3. Synthesize this into a hyper-concise intelligence brief.

OUTPUT JSON FORMAT:
{
  "status": "Threat Level Increased" | "Threat Level Decreased" | "No Meaningful Change",
  "intelSummary": "2-3 brutal sentences explaining exactly what changed and why it matters.",
  "strategicImplication": "What exactly should the founder DO about this? (e.g., 'Acceleration required: their new lower tier undercuts your margin, shift focus to enterprise').",
  "pricingTiers": [
    {
      "tier": "Name of tier (e.g., Free, Pro)",
      "price": "$0/mo",
      "limits": "Key limits or features (e.g., 5 users, no API)"
    }
  ],
  "fundingOrMNA": "Any details on them raising money or being acquired. Or 'None found'."
}
`;

  return think(prompt, "CompetitorDiff");
}
