import { think } from '../ai';

export async function rewritePitchSlide(ideaContext: string, currentSlide: any, founderFeedback: string): Promise<string> {
  const prompt = `
You are an expert pitch deck copywriter helping a founder refine a single slide based on their specific feedback.

STARTUP CONTEXT:
${ideaContext}

CURRENT SLIDE (Needs fixing):
${JSON.stringify(currentSlide, null, 2)}

FOUNDER'S INSTRUCTION / FEEDBACK:
"${founderFeedback}"

TASK:
Rewrite this specific slide to perfectly address the founder's feedback while keeping it tight, punchy, and investor-ready. 
Do not hallucinate new metrics unless the founder provided them. 
Ensure the layout still makes sense for the content.

OUTPUT JSON FORMAT (Must match exact slide schema so it drops right in):
{
  "updatedSlide": {
    "slideNumber": ${currentSlide.slideNumber},
    "title": "Short Slide Title",
    "subtitle": "Punchy one-sentence takeaway/headline",
    "slideLayout": "text" | "chart" | "comparison",
    "bulletPoints": ["Point 1", "Point 2", "Point 3"],
    "objectionHotspot": "The #1 brutal question an investor will ask... updated if necessary.",
    "speakerNotes": "Detailed guidance for the founder on what to emphasize."
  }
}
`;

  return think(prompt, "SlideRewriter");
}
