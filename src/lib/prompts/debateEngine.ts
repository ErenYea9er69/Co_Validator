import { thinkDeep, thinkFast } from '../ai';

export async function runDebate(
  idea: string,
  researchSummary: string
): Promise<string> {
  const bearPrompt = `
You are the "Bear Agent" (Adversarial Critic). Your goal is to find every reason why this startup will FAIL.
Ignore the hype. Be cynical, realistic, and focus on:
- Dis-economies of scale.
- Incumbent retaliation (the "Google will just do this" argument).
- Fragile unit economics.
- Founder/Execution gaps.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK: Provide the 3 most devastating arguments against this startup.
`;

  const bullPrompt = `
You are the "Bull Agent" (Visionary Defender). Your goal is to find why this startup will become a BILLION DOLLAR company.
Focus on:
- Unfair advantages.
- The "Why Now" catalyst.
- Potential for a "Compliance Moat" or "Network Effect".
- Massive TAM/Market Shift.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK: Provide the 3 strongest arguments for why this startup wins big.
`;

  const [bearRaw, bullRaw] = await Promise.all([
    thinkFast([{ role: 'system', content: 'You are a cynical, battle-hardened VC who has seen thousands of startups fail.' }, { role: 'user', content: bearPrompt }]),
    thinkFast([{ role: 'system', content: 'You are a visionary growth investor with a 100-year horizon.' }, { role: 'user', content: bullPrompt }])
  ]);

  const moderatorPrompt = `
You are a "Master Validator". You have just witnessed a debate between a Bear and a Bull.

IDEA:
${idea}

BEAR'S CASE:
${bearRaw}

BULL'S CASE:
${bullRaw}

RESEARCH CONTEXT:
${researchSummary}

TASK: Synthesize this debate. What is the "Ground Truth"? Weigh the arguments and provide a calibrated risk/reward assessment.

FORMAT:
Return a JSON object:
{
  "bearCase": "${bearRaw.replace(/"/g, '\\"')}",
  "bullCase": "${bullRaw.replace(/"/g, '\\"')}",
  "groundTruth": "The objective reality after weighing both sides...",
  "unresolvedConflict": "What we still don't know...",
  "debateScore": 65 // 1-100 favoring Bull (high) or Bear (low)
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a Master Validator specializing in adversarial analysis and multi-agent synthesis.' },
    { role: 'user', content: moderatorPrompt }
  ], { jsonMode: true });
}
