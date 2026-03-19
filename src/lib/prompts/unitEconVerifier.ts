import { think } from '../ai';

export async function unitEconomicsVerifier(financialOutputStr: string, industryBenchmarkSearchRaw: string): Promise<string> {
  const prompt = `
  You are the "Unit Economics Verifier". Your job is to check the AI's financial estimations against real-world industry benchmarks.

  AI FINANCIAL ESTIMATES:
  ${financialOutputStr}

  REAL-WORLD BENCHMARKS (Search Results):
  ${industryBenchmarkSearchRaw}

  TASK:
  1. Extract the key metrics claimed in the AI estimates (e.g., CAC, LTV, Gross Margin, Churn).
  2. Find the corresponding median/average for that specific metric in the real-world search results.
  3. Flag any AI estimate that is significantly wildly optimistic compared to reality. (e.g., AI says CAC is $50, Real World says B2B SaaS CAC is $800).

  FORMAT:
  Return a JSON object:
  {
    "metricsChecked": [
      {
        "metric": "e.g., CAC",
        "aiEstimate": "$50",
        "industryMedian": "$800",
        "deltaState": "Optimistic Fiction | Realistic | Pessimistic",
        "correctionLogic": "Why the AI's number is impossible in the real world."
      }
    ],
    "modelViability": "Viable | Broken",
    "theHardTruth": "A blunt 1-sentence reality check on their unit economics."
  `;

  return think([
    { role: 'system', content: 'You are a pragmatic CFO who trusts verifiable data over AI hallucinated spreadsheet numbers.' },
    { role: 'user', content: prompt }
  ], 'UnitEconVerifier');
}
