import { thinkDeep } from '../ai';

export async function generateActionPlan(idea: string, validationResults: string): Promise<string> {
  const messages = [
    {
      role: 'system' as const,
      content: `You are a startup execution strategist. Generate a concrete, actionable plan for validating and building this startup idea. Be specific — no vague advice.`,
    },
    {
      role: 'user' as const,
      content: `Generate action plans for this validated startup idea.

IDEA:
${idea}

VALIDATION RESULTS:
${validationResults}

Generate:
1. **PROOF-OF-LIFE EXPERIMENTS**: Suggest 3 specific "Smoke Tests" (e.g., a landing page headline test, a 5nd-degree network outreach test) that cost $0 and take < 48 hours to prove/disprove the core thesis.
2. A 30-day validation plan (test if people will pay) with **CONTINGENCY BRANCHING** (e.g. "If X happens, then do Y, else Pivot to Z").
3. A 90-day MVP plan (build and launch v1)

Output JSON:
{
  "smokeTests": [
    { "name": "...", "description": "...", "cost": "$0", "time": "< 48hr", "successMetric": "..." }
  ],
  "northStarMetric": {
    "name": "The primary metric to track",
    "target": "Specific numeric target by day 90",
    "why": "Explanation of why this metric determines success",
    "trackingHow": "How to measure it (e.g. Mixpanel, custom DB query)"
  },
  "thirtyDayPlan": {
    "thesis": "one-sentence founder thesis",
    "contingencyBranching": "Decision tree logic for pivots",
    "weeks": [
      {
        "week": 1,
        "focus": "what to focus on",
        "tasks": ["specific tasks"],
        "milestone": "what success looks like",
        "shadowTask": "High-impact non-obvious growth hack"
      }
    ],
    "validationMetrics": ["specific metrics to track"],
    "killCriteria": "when to abandon this idea"
  },
  "ninetyDayPlan": {
    "phases": [
      {
        "phase": "Phase 1: Foundation (weeks 1-4)",
        "goals": ["goals"],
        "deliverables": ["deliverables"],
        "techStack": "suggested tech"
      }
    ],
    "launchStrategy": "how to launch",
    "firstCustomerStrategy": "how to get first 10 paying customers",
    "revenueTarget": "target revenue at 90 days"
  },
  "recommendedToolbox": [
    {
      "name": "Tool Name",
      "purpose": "Why you need it",
      "link": "https://example.com",
      "cost": "Free/Paid/Tier"
    }
  ],
  "outreachHooks": [
    {
      "channel": "Cold Email | Twitter DM | LinkedIn",
      "hook": "Specific copy or angle to use"
    }
  ]
}`,
    },
  ];

  return thinkDeep(messages, { jsonMode: true, temperature: 0.6, maxTokens: 6144 });
}
