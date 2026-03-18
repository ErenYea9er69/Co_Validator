import { thinkDeep, thinkFast } from '../ai';

export async function runDebate(
  idea: string,
  researchSummary: string
): Promise<string> {
  const bearPrompt = `
You are the "Adversarial Bear". Your task is to perform an epistemically honest attack on this idea.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

HARD CONSTRAINT:
You CANNOT finish your analysis until you have identified at least ONE real-world company (named) that tried a similar approach and failed, with a specific reason. 
If you cannot find one in the research or your knowledge, you MUST explicitly state: "NO HISTORICAL FAILURE DATA FOUND - UNVERIFIED RISK ZONE."

TASK: Provide the 3 most devastating, evidence-backed arguments against this startup.
`;

  const bullPrompt = `
You are the "Visionary Bull". Your task is to perform an epistemically honest defense of this idea.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

HARD CONSTRAINT:
You CANNOT finish your analysis until you have identified at least ONE real-world company (named) in an adjacent or comparable space that achieved $10M+ ARR using a similar go-to-market or core insight.
If you cannot find one, you MUST explicitly state: "NO HISTORICAL SUCCESS DATA FOUND - PURE SPECULATION ZONE."

TASK: Provide the 3 strongest, evidence-backed arguments for why this startup wins big.
`;

  const [bearRaw, bullRaw] = await Promise.all([
    thinkFast([{ role: 'system', content: 'You are a cynical, battle-hardened VC. You value hard evidence over theory.' }, { role: 'user', content: bearPrompt }]),
    thinkFast([{ role: 'system', content: 'You are a visionary growth investor. You value proven scale patterns over theory.' }, { role: 'user', content: bullPrompt }])
  ]);

  const moderatorPrompt = `
You are the "Master Validator". You have just witnessed a debate between a Bear and a Bull.

IDEA:
${idea}

BEAR'S CASE (Constraint: Must cite named failure):
${bearRaw}

BULL'S CASE (Constraint: Must cite named success):
${bullRaw}

TASK: Synthesize this debate into "The Ground Truth". 
Where do they agree? Where is the conflict genuine? 
Identify if either agent failed their "Hard Evidence" constraint (stating "Unverified/Speculation zone").

FORMAT:
Return a JSON object:
{
  "bearCase": "${bearRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "bullCase": "${bullRaw.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "groundTruth": "The objective reality after weighing both sides...",
  "unresolvedConflict": "The primary tension that remains...",
  "evidenceStrength": "High | Medium | Low",
  "historicalPrecedent": "Summary of the named companies cited by both agents."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a Master Validator specializing in adversarial analysis and multi-agent synthesis.' },
    { role: 'user', content: moderatorPrompt }
  ], { jsonMode: true });
}

