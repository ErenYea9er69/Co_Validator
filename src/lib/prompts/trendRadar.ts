import { think } from '../ai';

export async function trendRadar(industry: string, recentNewsSummary: string): Promise<string> {
  const prompt = `
  You are the "Industry Trend Radar". 
  Your job is to establish the Ground Truth for the CURRENT state of this industry (last 90 days), so other agents don't rely on stale training data.

  INDUSTRY / CATEGORY: 
  ${industry}

  FRESH NEWS & DATA (LAST 90 DAYS):
  ${recentNewsSummary}

  TASK:
  1. Synthesize the most critical shifts in this category over the last 90 days.
  2. Identify the "Categorical Baseline" — what features are now table-stakes that used to be differentiators?
  3. Identify "Recent Graveyard Additions" — what sub-categories died recently?
  4. Generate a 2-sentence "Reality Check" designed to slap the founder awake to the current level of competition.

  FORMAT:
  Return a JSON object:
  {
    "majorShifts": ["Shift 1", "Shift 2"],
    "categoricalBaseline": "Features that are no longer enough to win...",
    "recentGraveyard": "Recent failures in this space...",
    "realityCheck": "Brutal 2-sentence summary of the current bloodbath."
  `;

  return think([
    { role: 'system', content: 'You are an elite industry analyst who only cares about what has changed in the LAST 90 DAYS.' },
    { role: 'user', content: prompt }
  ], 'TrendRadar');
}
