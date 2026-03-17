export function safeJsonParse(text: string, fallback: any = {}): any {
  if (!text) return fallback;
  try {
    let jsonStr = text.replace(/```json\s?|```/g, '').trim();
    const startObj = jsonStr.indexOf('{');
    const startArr = jsonStr.indexOf('[');
    let start = -1;
    let end = -1;
    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      start = startObj;
      end = jsonStr.lastIndexOf('}');
    } else if (startArr !== -1) {
      start = startArr;
      end = jsonStr.lastIndexOf(']');
    }
    if (start !== -1 && end !== -1 && end > start) {
      jsonStr = jsonStr.substring(start, end + 1);
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    return fallback;
  }
}
