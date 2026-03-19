import { think } from '../ai';

export async function generateSprintPlan(idea: any, auditResult: any, rawData?: any, previousWeekSummary?: string): Promise<string> {
  const systemPrompt = `You are an elite, no-nonsense startup accelerator partner (think Y Combinator). You just audited a founder's idea, found critical flaws, and now you must give them a hyper-actionable 7-day sprint plan to validate or kill the idea.

RULES:
1. No generic advice ("do market research").
2. Give EXACT scripts to copy-paste (emails, Reddit posts, cold DMs).
3. Name EXACT platforms (e.g., "Post in r/macapps", not "Post on forums").
4. Define concrete grading criteria for every task.
5. Focus aggressively on validating the riskiest assumptions from the audit.
6. Each task MUST include an estimated time in minutes, a priority level, and a unique string ID.
7. Support sequential workflows. If a task requires earlier tasks to finish first, list their IDs in 'dependsOn'.
8. Tailor the plan to the founder's budget, stage, locale, and background, as well as known competitors.

OUTPUT JSON FORMAT:
{
  "focusOfTheWeek": "The single most critical assumption to prove or disprove this week.",
  "days": [
    {
      "day": 1,
      "theme": "Brief 2-3 word theme for the day",
      "tasks": [
        {
          "id": "t1",
          "title": "Action-oriented task title",
          "description": "Exhaustive description of exactly what to do, including copy-paste scripts.",
          "metric": "Concrete numeric goal (e.g., 'Get 5 replies', 'Log 15 signups')",
          "gradingCriteria": "What defines a Pass vs Fail in the real world (e.g., 'Pass: 3+ people reply saying they would pay. Fail: crickets or polite declines.')",
          "estimatedMinutes": 45,
          "priority": "high",
          "dependsOn": []
        }
      ]
    }
  ]
}

priority must be one of: "high", "medium", "low".
estimatedMinutes must be a realistic integer (15 to 240).
dependsOn is an array of task IDs that must be completed before this one.
`;

  const competitorContext = rawData?.p2?.result?.directCompetitors 
    ? `COMPETITOR THREATS TO EXPLOIT OR AVOID:\n${JSON.stringify(rawData.p2.result.directCompetitors)}` 
    : '';

  const userPrompt = `
FULL IDEA CONTEXT:
Name: ${idea.name}
Problem: ${idea.problem}
Solution: ${idea.solution || 'Not specified'}
Industry: ${idea.industry || 'Not specified'}
Target Audience: ${idea.targetAudience}
Monetization: ${idea.monetization || 'Not specified'}
Stage: ${idea.stage || 'idea'}
Budget: ${idea.budget || 'Unknown'}
Locale: ${idea.locale || 'Global'}
Founder Background: ${idea.founderBackground || 'Not specified'}
Pricing: ${idea.targetPricing || 'Not specified'}
Acquisition Channel: ${idea.acquisitionChannel || 'Not specified'}

${competitorContext}

AUDIT RESULTS:
Verdict: ${auditResult.verdict}
The Core Bet: ${auditResult.coreBet}
Stop Signal: ${auditResult.stopSignal}

CRITICAL ASSUMPTIONS TO PROVE:
${auditResult.criticalAssumptionStack?.map((a: any, i: number) => `${i + 1}. ${typeof a === 'string' ? a : a.assumption}`).join('\n')}
${previousWeekSummary ? `
PREVIOUS WEEK SUMMARY (build on this, don't repeat):
${previousWeekSummary}
` : ''}
Generate a brutal, highly tactical 7-day sprint plan to test the above assumptions.
`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt }
  ];

  return think(messages, "SprintPlanGenerator");
}
