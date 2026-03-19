import { think } from '../ai';

export async function generatePitchDeck(idea: any, auditResult: any, rawData?: any): Promise<string> {
  const prompt = `
You are a master pitch deck architect who writes decks that actually raise money from tier-1 VCs.
We need to generate a 10-slide pitch deck structure for this startup idea.
You have the founder's raw idea, the results of a Brutal AI Audit, and the underlying expert data.

IDEA:
Name: ${idea.name}
Problem: ${idea.problem}
Solution: ${idea.solution || 'Not specified'}
Target Audience: ${idea.targetAudience}

AUDIT RESULTS:
Verdict: ${auditResult.verdict}
Core Bet: ${auditResult.coreBet}
Critical Assumptions: ${auditResult.criticalAssumptionStack?.map((a: any) => typeof a === 'string' ? a : a.assumption).join(' | ')}

EXPERT DATA (use these numbers/analysis for specific slides):
- Market Size (p3): ${JSON.stringify(rawData?.p3?.result || 'Not available')}
- Competitor Analysis (p2): ${JSON.stringify(rawData?.p2?.result || 'Not available')}
- GTM/Channel Strategy (p4): ${JSON.stringify(rawData?.p4?.result || 'Not available')}
- Financial Projections (p6): ${JSON.stringify(rawData?.p6?.result || 'Not available')}
- Problem Validation (p1): ${JSON.stringify(rawData?.p1?.result || 'Not available')}

TASK:
Generate a 10-slide pitch deck (slides array of objects).
Do not use placeholders. Use the data provided.
If the audit suggests a pivot, the deck should reflect that pivot.
The slides MUST follow this flow:
1. Title & Value Prop
2. The Problem (Brutal reality)
3. The Solution (How we win)
4. Why Now? (Market timing)
5. Market Size (Real numbers from p3)
6. Competition (Direct threats from p2)
7. Product Roadmap (Iteration plan)
8. Business Model (Pricing from idea + p6 viability)
9. The Team & Founder Fit (p7)
10. The Ask & Vision

OUTPUT JSON FORMAT:
{
  "slides": [
    {
      "slideNumber": 1,
      "title": "Short Slide Title",
      "subtitle": "Punchy one-sentence takeaway/headline",
      "slideLayout": "text" | "chart" | "comparison",
      "bulletPoints": ["Point 1", "Point 2", "Point 3"],
      "objectionHotspot": "The #1 brutal question an investor will ask exactly when you show this slide (e.g., 'Warning: VCs will challenge this TAM calculation as top-down nonsense').",
      "speakerNotes": "Detailed guidance for the founder on what to emphasize."
    }
  ]
}
`;

  return think(prompt, "PitchDeckGenerator");
}
