import { think } from '../ai';

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
    1. **The Burn Rate Guillotine (Death Projections)**: 
       - Calculate exactly how many months the startup has until they run out of their stated budget (CASH-OUT DATE).
       - Assume standard industry costs if not specified: Hosting ($200/mo), API/Saas ($500/mo), Essential Marketing ($1k/mo), and Founder Survival ($3k/mo per person if non-technical and requiring external dev hire).
    2. **6-Month Survival Model**: 
       - What is the MAXIMUM CAC this business can afford before math breaks?
       - What is the MINIMUM ACV required to sustain a sales motion?
    3. **Operational Stressors**: 3 most expensive operational execution risks.
    4. **Exit Ecosystem Reality**: Potential acquirers and their strategic logic.

    FORMAT:
    Return a JSON object:
    {
      "deathGuillotine": {
        "monthsToZero": number,
        "cashOutDate": "Estimated Month/Year",
        "burnBreakdown": "Brief list of major costs.",
        "fatalConstraint": "The specific cost that kills them fastest."
      },
      "survivalSkeleton": {
        "maxAffordableCAC": "$X",
        "minSurvivalChurn": "Y%",
        "minTargetACV": "$Z",
        "burnToFirstMilestone": "$A"
      },
      "breakevenConditions": "Specific milestones required to stop the bleed.",
      "operationalStressors": [
        { "risk": "...", "impact": "High | Med", "mitigation": "..." }
      ],
      "stressTests": [
        { "scenario": "...", "impact": "...", "survivalStrategy": "..." }
      ],
      "unitEconomics": {
        "cacTarget": number,
        "ltvProjection": number,
        "paybackPeriod": "months",
        "marginProfile": "percentage"
      },
      "fundingRequiredToScale": "Estimated capital needed for next stage.",
      "capitalIntensity": "Low | Moderate | High",
      "exitScore": number, // 0-100
      "exitScenarios": [
        { "acquirer": "...", "estimatedMultiple": "...", "logic": "..." }
      ],
      "unitEconomicsLogic": "Summary of the 'gritty reality' of the next 6 months."
    }
`;

  const result = await think([
    { role: 'system', content: 'You are a "CFO Simulator" specializing in startup unit economics and burn rate risk analysis.' },
    { role: 'user', content: prompt }
  ], { jsonMode: true });

  return result.content;
}
