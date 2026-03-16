import { thinkDeep } from './ai';

export interface StartupIdea {
  name: string;
  problem: string;
  solution: string;
  competitors?: string;
  monetization?: string;
}

export interface FounderDNA {
  skills: string[];
  budget: string;
  timeCommitment: string;
}

export async function validateIdea(
  idea: StartupIdea,
  founderDNA: FounderDNA | null,
  pastFailures: string = "None",
  customCriteria: string = "None"
): Promise<any> {
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
${pastFailures}

CRITICAL CONSTRAINTS:
${customCriteria}

TASK:
1. **14-Dimension Score**: Audit across standard dimensions (0-10).
2. **GRAVEYARD BASELINE COMPARISON**: Compare this idea against the Graveyard. 
3. **The Brutal Truth**: A 1-sentence, unfiltered reality check.
4. **Future Sandbox**: 
   - **The Billion Dollar Path**
   - **The Zombie Path**
5. **Unit Economics Snapshot**: Estimate LTV, CAC, and Payback.

FORMAT:
Return a JSON object:
{
  "scores": {
    "market": {
      "problemSeverity": { "score": 0, "signal": "", "benchmark": "" },
      "marketSize": { "score": 0, "signal": "", "benchmark": "" },
      "timing": { "score": 0, "signal": "", "benchmark": "" }
    },
    "execution": {
      "timeToMVP": { "score": 0, "signal": "", "benchmark": "" },
      "salesComplexity": { "score": 0, "signal": "", "benchmark": "" },
      "operationalIntensity": { "score": 0, "signal": "", "benchmark": "" }
    },
    "moat": {
      "competitiveDensity": { "score": 0, "signal": "", "benchmark": "" },
      "scalability": { "score": 0, "signal": "", "benchmark": "" },
      "moatStrength": { "score": 0, "signal": "", "benchmark": "" },
      "platformRisk": { "score": 0, "signal": "", "benchmark": "" }
    },
    "survivability": {
      "founderFit": { "score": 0, "signal": "", "benchmark": "" },
      "regulatoryRisk": { "score": 0, "signal": "", "benchmark": "" },
      "monetization": { "score": 0, "signal": "", "benchmark": "" },
      "unitEconomics": { "score": 0, "signal": "", "benchmark": "" }
    }
  },
  "compositeScores": {
    "overallWinnability": 0,
    "technicalFeasibility": 0,
    "marketOpportunity": 0
  },
  "brutalTruth": "",
  "futureSandbox": {
    "billionDollarPath": "",
    "zombiePath": ""
  },
  "unitEconomicsReality": {
    "ltv": "",
    "cac": "",
    "payback": "",
    "margin": ""
  },
  "category": "",
  "verdict": "highly_promising | cautious_proceed | pivot_required | kill",
  "verdictLabel": "",
  "majorRisks": [],
  "killReasons": [],
  "suggestedPivots": []
}`,
    },
  ];

  const response = await thinkDeep(messages, { jsonMode: true });
  return JSON.parse(response);
}
