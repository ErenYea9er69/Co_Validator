import { thinkDeep } from '../ai';

export async function generateRoadmap(
  ideaStr: string,
  auditSummary: string
): Promise<string> {
  const prompt = `
You are a "Startup Growth Architect." 
Based on the Deep Audit results, generate a 3-6 month execution roadmap for this project.

IDEA:
${ideaStr}

AUDIT SUMMARY:
${auditSummary}

TASK: Create a prioritized, actionable roadmap that addresses the biggest risks identified in the audit.
GTM Focus: Ensure Phase 1 and 2 include specific acquisition milestones (e.g., "Secure first 5 pilots," "Achieve $0.50 CPC benchmark").
Constraint-Based Sequencing: Do not suggest building complex features until basic acquisition logic is validated.

Format your response as a JSON object:
{
  "phases": [
    {
      "name": "string", // e.g., "Phase 1: Validation & MVP"
      "duration": "string", // e.g., "Month 1-2"
      "tasks": [
        {
          "task": "string",
          "priority": "High" | "Medium" | "Low",
          "description": "string"
        }
      ]
    }
  ],
  "criticalMilestone": "string", // The single most important thing to achieve next
  "resourceAdvice": "string" // How to best use their specific budget/skills
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a startup executor. You turn strategic audits into actionable plans.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}
