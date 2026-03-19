import { think } from '../ai';

export async function coronerReport(idea: string, autopsyResults: string): Promise<string> {
    const prompt = `
    You are the "Venture Coroner".
    Perform a autopsy on this failed startup strategy.
    
    IDEA:
    ${idea}
    
    AUTOPSY RESULTS (Simulation Data):
    ${autopsyResults}
    
    TASK:
    1. Identify the specific "Cause of Death".
    2. Document the "Fatal Chain" (sequential failures).
    3. Issue a "Post-Mortem Warning" to future founders.
    
    Return a JSON object:
    {
      "causeOfDeath": "string",
      "fatalChain": ["string"],
      "expertWarning": "string",
      "survivalProbability": 0
    }
    `;
    
    return think(prompt, 'CoronerReport');
}
