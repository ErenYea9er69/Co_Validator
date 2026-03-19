import { think } from '../ai';

export async function generateInvestorMatch(idea: any, auditResult: any): Promise<string> {
  const prompt = `
You are a highly-connected Venture Partner or Angel Syndicate Lead.
A founder is asking you who they should pitch this idea to.
You have their raw idea and the Brutal AI Audit of its flaws and core bet.

IDEA:
Name: ${idea.name}
Industry: ${idea.industry}
Stage: ${idea.stage}
Target Audience: ${idea.targetAudience}

AUDIT:
Verdict: ${auditResult.verdict}
Core Bet: ${auditResult.coreBet}

TASK:
1. Identify the Exact Archetypes of investors who fund THIS specific type of risk (e.g., "Deep tech early believers", "B2B SaaS metric-obsessed Series A funds", "Consumer social lottery tickets").
2. Give 2-3 examples of real-world firms/angels that fit this archetype.
3. List the 3 brutal questions these specific investors will use to destroy the founder in the pitch meeting.

OUTPUT JSON FORMAT:
{
  "investorArchetypes": [
    {
      "archetype": "Name of archetype",
      "whatTheyCareAbout": "One sentence on what drives them.",
      "exampleFirms": ["Sequoia", "a16z", "Local Angel Syndicate"],
      "fitScore": 85
    }
  ],
  "brutalQuestionsTheyWillAsk": [
    "Question 1 based on the audit's biggest weakness.",
    "Question 2",
    "Question 3"
  ]
}
`;

  return think(prompt, "InvestorMatcher");
}
