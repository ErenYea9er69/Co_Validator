import { thinkDeep } from '../ai';

export async function autonomousDefense(
  idea: string,
  synthesis: string,
  context: any // Can be interrogation questions or pre-mortem scenario
): Promise<string> {
  const isInterrogation = !!context.questions;
  
  const prompt = `
    ### ROLE
    You are the Global Strategy Lead for a high-stakes Venture Studio. 
    You are currently defending a startup idea during a rigorous validation "pressure test".
    
    ### IDEA UNDER OATH:
    ${idea}
    
    ### RESEARCH SYNTHESIS (The Ground Truth):
    ${synthesis}
    
    ### TASK:
    ${isInterrogation 
      ? `You have been asked a series of INTERROGATION QUESTIONS. Defend the idea by providing logical, evidence-based answers for each. 
         Use the Research Synthesis to find facts that support the defense. If the research says something is hard, explain the "Counter-Intuitive" way we will solve it.`
      : `You are facing a PRE-MORTEM FAILURE SCENARIO. You must propose an "Emergency Pivot" or a "Structural Defense" to ensure the idea survives this specific collapse scenario.
         SCENARIO: ${context.scenario}
         LURKING SHADOW: ${context.lurkingShadow}`
    }
    
    ### CONSTRAINTS:
    - Be aggressive, logical, and evidence-driven.
    - Do NOT be a "yes-man". Acknowledge real risks but provide superior tactical solutions.
    - Output ONLY a JSON object.
    
    ${isInterrogation 
      ? `### OUTPUT FORMAT (JSON Array of strings):
         ["Response to Q1", "Response to Q2", ...]`
      : `### OUTPUT FORMAT (JSON Array with 1 string):
         ["Your emergency defense/pivot strategy"]`
    }
  `;

  return await thinkDeep([{ role: 'user', content: prompt }], { temperature: 0.7 });
}
