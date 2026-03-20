import { think } from '../ai';

export async function survivorshipBiasDetector(ideaStr: string, graveyardSearchRaw: string): Promise<string> {
  const prompt = `
  You are the "Graveyard Detective". Your job is to counteract "Survivorship Bias" by studying startups that died trying to execute this exact idea.

  IDEA:
  ${ideaStr}

  GRAVEYARD DATA (Search Results for Failed Competitors):
  ${graveyardSearchRaw}

  TASK:
  1. Identify at least 3 distinct startups that failed solving this problem or in this specific market.
  2. For each, determine their primary "Cause of Death" based on the data (not guessing).
  3. Synthesize the "Fatal Pattern" — what is the specific trap that keeps killing companies in this space?

  FORMAT:
  Return a JSON object:
  {
    "similarFailures": [
      {
        "companyName": "Startup Name",
        "era": "e.g., 2012-2015",
        "fatalFlaw": "e.g., CAC too high",
        "realReasonForDeath": "Detailed internal reason if known",
        "source": "URL or article title where this was found"
      }
    ],
    "sharedDelusion": "The overarching reason this space is a graveyard.",
    "howToSurviveWhereTheyFailed": "The 1 thing the founder must prove to avoid being next."
  `;

  return think([
    { role: 'system', content: 'You are the curator of the Startup Graveyard. You study the dead to save the living.' },
    { role: 'user', content: prompt }
  ], 'SurvivorshipBias');
}
