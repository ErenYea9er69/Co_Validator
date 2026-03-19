import { think } from '../ai';

export async function gradeTaskOutcome(taskTitle: string, gradingCriteria: string, founderOutcome: string): Promise<string> {
  const prompt = `
You are a tough, pragmatic startup coach grading a founder's execution on a specific sprint task.
Your job is to read what the founder ACHIVED vs what the GRADING CRITERIA demanded, and determine if they passed, failed, or need to redo it.

TASK TITLE: ${taskTitle}
GRADING CRITERIA (The standard): ${gradingCriteria}
FOUNDER'S REPORTED OUTCOME: ${founderOutcome}

TASK:
1. Evaluate whether the founder's outcome meets or exceeds the grading criteria.
2. Be strict. If the criteria was '3 paying customers' and they got '10 signups but 0 paid', they FAILED.
3. Provide a brief, actionable coaching note.

OUTPUT JSON FORMAT:
{
  "status": "PASS" | "FAIL" | "INCOMPLETE",
  "reasoning": "One short sentence explaining why.",
  "coaching": "One short sentence of advice on what to do next."
}
`;

  return think(prompt, "TaskGrader");
}
