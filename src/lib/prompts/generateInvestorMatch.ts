import { think } from '../ai';

export async function generateInvestorMatch(idea: any, auditResult: any, rawData?: any): Promise<string> {
  const prompt = `
You are a highly-connected Venture Partner or Angel Syndicate Lead.
A founder is asking you who they should pitch this idea to and HOW to approach them.
You have their raw idea, the Brutal AI Audit, and the underlying expert data.

IDEA:
Name: ${idea.name}
Industry: ${idea.industry || 'Not specified'}
Stage: ${idea.stage || 'Idea'}
Target Audience: ${idea.targetAudience}

AUDIT:
Verdict: ${auditResult.verdict}
Core Bet: ${auditResult.coreBet}

EXPERT DATA (use these for specific matchmaking):
- Market Size (p3): ${JSON.stringify(rawData?.p3?.result || 'Not available')}
- Competitor Analysis (p2): ${JSON.stringify(rawData?.p2?.result || 'Not available')}
- GTM/Channel Strategy (p4): ${JSON.stringify(rawData?.p4?.result || 'Not available')}
- Financial Projections (p6): ${JSON.stringify(rawData?.p6?.result || 'Not available')}

TASK:
1. Identify the Exact Archetypes of investors (e.g., "Deep tech early believers", "B2B SaaS metric-obsessed Series A funds").
2. Give 2-3 examples of real-world firms/angels for each archetype.
3. For each archetype, provide a 3-sentence Cold Email Template that resonates with their specific investment thesis.
4. List the 3 most brutal questions they will ask.
5. Provide a "Recommended Answer Framework" for each question to help the founder survive.

OUTPUT JSON FORMAT:
{
  "investorArchetypes": [
    {
      "archetype": "Name of archetype",
      "whatTheyCareAbout": "One sentence on what drives them.",
      "exampleFirms": ["Sequoia", "a16z"],
      "fitScore": 85,
      "coldEmailTemplate": "Hi [Name], I'm building [Name]... [The Hook]... [The Ask]"
    }
  ],
  "brutalQuestions": [
    {
      "question": "The tough question",
      "answerFramework": "Step 1: Acknowledge X. Step 2: Show data Y. Step 3: Pivot to vision Z."
    }
  ]
}
`;

  return think(prompt, "InvestorMatcher");
}
