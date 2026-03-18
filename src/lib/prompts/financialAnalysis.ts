import { thinkDeep } from '../ai';

export async function financialAnalysis(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are a "Strategic Financial Architect". Your job is NOT to hallucinate projections, but to define the "Survival Skeleton" of this business.

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **Unit Economics Stress Test**: Instead of predicting LTV/CAC, define the break-even conditions.
   - What is the MAXIMUM CAC (Customer Acquisition Cost) this business can afford before the unit economics break?
   - What is the MINIMUM Monthly Churn required to stay alive?
   - What is the MINIMUM ACV (Annual Contract Value) required to support the sales motion?
2. **Capital Velocity & Burn**: 
   - How much "Burn" is required to reach a \$1M ARR milestone?
   - What are the 3 most expensive execution risks?
3. **Exit Ecosystem**: 
   - Identify 3-5 potential "Strategic Acquirers".
   - What is the "Rational Exit Multiple" for this specific segment based on current public markets?

FORMAT:
Return a JSON object:
{
  "survivalSkeleton": {
    "maxAffordableCAC": "$X",
    "minSurvivalChurn": "Y%",
    "minTargetACV": "$Z",
    "paybackLimitMonths": number
  },
  "operationalStressors": [
    { "risk": "...", "impact": "High | Med", "mitigation": "..." }
  ],
  "exitEcosystem": [
    { "acquirer": "...", "strategicLogic": "...", "exitMultiple": "..." }
  ],
  "unitEconomicsLogic": "Summary of what MUST be true for the financials to work."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a CFO and Venture Partner focusing on unit economics rigor and capital efficiency.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}

