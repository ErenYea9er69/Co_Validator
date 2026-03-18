import { thinkDeep } from '../ai';

export async function financialAnalysis(
  idea: string,
  researchSummary: string
): Promise<string> {
  const prompt = `
You are a "Strategic Financial Architect". Your job is NOT to hallucinate 5-year projections (which are pure spreadsheet fantasy for pre-product ideas), but to define the "6-Month Survival Skeleton".

IDEA:
${idea}

RESEARCH CONTEXT:
${researchSummary}

TASK:
1. **6-Month Survival Model**: Instead of predicting long-term scale, define the immediate break-even conditions.
   - What is the MAXIMUM CAC (Customer Acquisition Cost) this business can afford before the unit economics break?
   - What is the MINIMUM Monthly Churn required to stay alive for the first 180 days?
   - What is the MINIMUM ACV (Annual Contract Value) required to support a sustainable sales motion?
2. **Capital Velocity & Milestone Burn**: 
   - Exactly how much "Burn" is required to reach the FIRST meaningful milestone (e.g. 10 paying customers, or $10k ARR)?
   - What are the 3 most expensive operational execution risks in the next 6 months?
3. **Exit Ecosystem Reality**: 
   - Identify 3 potential "Strategic Acquirers" who would buy this for its team or niche tech, not just revenue.
   - What is a rational acquisition logic for this specific segment?

FORMAT:
Return a JSON object:
{
  "survivalSkeleton": {
    "maxAffordableCAC": "$X",
    "minSurvivalChurn": "Y%",
    "minTargetACV": "$Z",
    "paybackLimitMonths": number,
    "burnToFirstMilestone": "$A"
  },
  "operationalStressors": [
    { "risk": "...", "impact": "High | Med", "mitigation": "..." }
  ],
  "exitEcosystem": [
    { "acquirer": "...", "strategicLogic": "..." }
  ],
  "unitEconomicsLogic": "Summary of the 'gritty reality' of the next 6 months."
}
`;

  return await thinkDeep([
    { role: 'system', content: 'You are a CFO and Venture Partner focusing on unit economics rigor and capital efficiency.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });
}

