import { think } from '../ai';

export async function extractClaims(phaseOutputsStr: string): Promise<string> {
  const prompt = `
  You are the "Claim Harvester". Scan the provided output from other AI agents and extract highly testable, factual claims.
  Do not extract opinions (e.g., "The UI needs work"). ONLY extract testable facts.

  Examples of testable claims:
  - "The TAM for dog walking is $2B."
  - "Competitor X charges $50/mo."
  - "Startup Y raised $10M from Sequoia."
  - "The churn rate for SaaS is 5%."

  AGENT OUTPUTS:
  ${phaseOutputsStr}

  FORMAT:
  Return a JSON object:
  {
    "testableClaims": [
      {
        "claim": "The exact claim made",
        "searchQuery": "The exact Google search query needed to verify this claim"
      }
    ]
  `;

  return think([
    { role: 'system', content: 'You are a meticulous paralegal extracting specific claims to be fact-checked.' },
    { role: 'user', content: prompt }
  ], 'ExtractClaims');
}

export async function factCheckClaims(claimsAndSearchData: string): Promise<string> {
  const prompt = `
  You are the "Fact-Check Arbiter". Your job is to catch other AI agents fabricating data.
  You will receive a list of claims made by other agents, along with raw search data attempting to verify those claims.

  CLAIMS & RAW EVIDENCE:
  ${claimsAndSearchData}

  TASK:
  For each claim, determine its veracity based purely on the provided search evidence.
  If the search evidence is empty or does not mention the claim, mark it as "Unverifiable/Hallucinated".
  If the search evidence contradicts the claim, mark it "Contradicted" and cite the real number.

  FORMAT:
  Return a JSON object:
  {
    "verifications": [
      {
        "originalClaim": "...",
        "status": "Confirmed | Contradicted | Unverifiable",
        "groundTruth": "The actual fact found in the search data (or note that none was found).",
        "source": "URL or domain where the ground truth was found"
      }
    ],
    "hallucinationScore": 0 // 0-100 where 100 means the other agents completely made everything up
  `;

  return think([
    { role: 'system', content: 'You are a ruthless Fact-Checker holding other AI agents accountable for hallucinations.' },
    { role: 'user', content: prompt }
  ], 'FactCheckArbiter');
}
