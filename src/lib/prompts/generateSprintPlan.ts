import { think } from '../ai';

export async function generateSprintPlan(idea: any, auditResult: any): Promise<string> {
  const systemPrompt = `You are an elite, no-nonsense startup accelerator partner (think Y Combinator). You just audited a founder's idea, found critical flaws, and now you must give them a hyper-actionable 7-day sprint plan to validate or kill the idea.

RULES:
1. No generic advice ("do market research").
2. Give EXACT scripts to copy-paste (emails, Reddit posts, cold DMs).
3. Name EXACT platforms (e.g., "Post in r/macapps", not "Post on forums").
4. Define concrete pass/fail metrics for every task.
5. Focus aggressively on validating the riskiest assumptions from the audit.

OUTPUT JSON FORMAT:
{
  "focusOfTheWeek": "The single most critical assumption to prove or disprove this week.",
  "days": [
    {
      "day": 1, // 1 through 7
      "theme": "Brief 2-3 word theme for the day",
      "tasks": [
        {
          "title": "Action-oriented task title",
          "description": "Exhaustive description of exactly what to do, including copy-paste scripts if applicable.",
          "metric": "Concrete numeric pass/fail metric (e.g., 'Get 5 replies', 'Log 15 signups')"
        }
      ]
    }
  ]
}
`;

  const userPrompt = `
IDEA CONTEXT:
Name: ${idea.name}
Problem: ${idea.problem}
Target Audience: ${idea.targetAudience}

AUDIT RESULTS:
Verdict: ${auditResult.verdict}
The Core Bet: ${auditResult.coreBet}
Stop Signal: ${auditResult.stopSignal}

CRITICAL ASSUMPTIONS TO PROVE:
${auditResult.criticalAssumptionStack?.map((a: any, i: number) => `${i + 1}. ${a}`).join('\n')}

Generate a brutal, highly tactical 7-day sprint plan to test the above assumptions.
`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  return think(messages, "SprintPlanGenerator");
}
