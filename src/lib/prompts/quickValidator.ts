import { thinkDeep } from '../longcat';

export async function quickValidator(
  idea: { name: string, problem: string, solution: string, competitors?: string, monetization?: string },
  founderDNA: { skills: string[], budget: string, timeCommitment: string } | null,
  pastFailures: string,
  customCriteria?: string
): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are "The Silicon Valley Blitz-Auditor." Your goal is to provide a high-pressure, pattern-matching audit of a startup idea in seconds.
      You rely on deep internal knowledge of thousands of failed and successful startups to benchmark this idea.
      BE BRUTAL. Look for the "fatal flaw" that common analysts miss.`,
    },
    {
      role: 'user' as const,
      content: `Perform a Blitz-Audit on this startup idea.

IDEA DATA:
- Name: ${idea.name}
- Problem: ${idea.problem}
- Proposed Solution: ${idea.solution}
- Known Competitors: ${idea.competitors || 'None provided'}
- Revenue Model: ${idea.monetization || 'None provided'}

FOUNDER DNA:
- Skills: ${founderDNA?.skills.join(', ') || 'Technical Generalist'}
- Budget Path: ${founderDNA?.budget || 'Bootstrap'}
- Time: ${founderDNA?.timeCommitment || 'Full-time'}

THE GRAVEYARD (Past Failures):
${pastFailures || 'None'}

CRITICAL CONSTRAINTS:
${customCriteria || 'None'}

TASK:
1. **14-Dimension Score**: Audit across standard dimensions (0-10).
   - **DYNAMIC WEIGHTING**: Weight the scores based on the Founder DNA. (e.g., if the founder is non-technical, "Ease of MVP" should carry 2x weight).
2. **GRAVEYARD BASELINE COMPARISON**: Compare this idea against the Graveyard. If it's a semantic repeat of a past rejection, mark it as "Proximity Alert".
3. **The Brutal Truth**: A 1-sentence, unfiltered reality check.
4. **Future Sandbox**: 
   - **The Billion Dollar Path**: What does it look like if they win the market?
   - **The Zombie Path**: How does it slowly die into a lifestyle business or failure?
5. **Unit Economics Snapshot**: Estimate LTV, CAC, and Payback based on benchmarks.

FORMAT:
Return a JSON object:
{
  "scores": {
    "market": {
      "problemSeverity": { "score": 8, "signal": "Why this is critical", "benchmark": "e.g. Stripe for payments" },
      "marketSize": { "score": 7, "signal": "TAM/SAM breakdown", "benchmark": "e.g. $10B industry" },
      "timing": { "score": 8, "signal": "Why now?", "benchmark": "e.g. Post-COVID shift" }
    },
    "execution": {
      "timeToMVP": { "score": 8, "signal": "Speed to first $1", "benchmark": "e.g. 2 weeks to launch" },
      "salesComplexity": { "score": 7, "signal": "Friction in closing", "benchmark": "e.g. Low-touch PLG" },
      "operationalIntensity": { "score": 6, "signal": "Human labor required", "benchmark": "e.g. Fully automated" }
    },
    "moat": {
      "competitiveDensity": { "score": 4, "signal": "Crowdedness", "benchmark": "e.g. Blue ocean" },
      "scalability": { "score": 6, "signal": "Margin expansion", "benchmark": "e.g. AWS-style scaling" },
      "moatStrength": { "score": 5, "signal": "Defensibility", "benchmark": "e.g. Network effects" },
      "platformRisk": { "score": 8, "signal": "Dependency on Big Tech", "benchmark": "e.g. API-only risk" }
    },
    "survivability": {
      "founderFit": { "score": 9, "signal": "DNA alignment", "benchmark": "e.g. Industry veteran" },
      "regulatoryRisk": { "score": 9, "signal": "Legal hurdles", "benchmark": "e.g. HIPAA compliance" },
      "monetization": { "score": 7, "signal": "Pricing power", "benchmark": "e.g. High LTV potential" },
      "unitEconomics": { "score": 7, "signal": "LTV/CAC ratio", "benchmark": "e.g. 3:1 ratio" }
    }
  },
  "criticalGate": {
    "dimension": "moatStrength",
    "score": 5,
    "reason": "The biggest blocker to success."
  },
  "compositeScores": {
    "overallWinnability": 74,
    "technicalFeasibility": 85,
    "marketOpportunity": 70
  },
  "brutalTruth": "The unfiltered reality check.",
  "futureSandbox": {
    "billionDollarPath": "Description of the winning timeline.",
    "zombiePath": "Description of the slow death timeline."
  },
  "unitEconomicsReality": {
    "ltv": "$ Estimate",
    "cac": "$ Estimate",
    "payback": "Months",
    "margin": "%"
  },
  "category": "B2B SaaS | Fintech | ...",
  "verdict": "highly_promising | cautious_proceed | pivot_required | kill",
  "verdictLabel": "Short summary",
  "majorRisks": ["Risk 1", "Risk 2"],
  "killReasons": ["Reason it might fail"],
  "suggestedPivots": ["Alternative angle 1"]
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.5 });
}
