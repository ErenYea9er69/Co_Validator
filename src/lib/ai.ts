import OpenAI from 'openai';
import crypto from 'crypto';

const API_KEYS = [
  process.env.OPENAI_API_KEY || '',
  process.env.OPENAI_API_KEY_2 || '',
  process.env.OPENAI_API_KEY_3 || '',
  process.env.OPENAI_API_KEY_4 || '',
  process.env.OPENAI_API_KEY_5 || '',
].filter(Boolean);

function getKeyForPulse(pulse: string): string {
  if (API_KEYS.length === 0) return '';
  const hash = crypto.createHash('md5').update(pulse).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % API_KEYS.length;
  return API_KEYS[index];
}

const getClient = (pulse: string) => new OpenAI({
  apiKey: getKeyForPulse(pulse),
});

export async function think(
  prompt: string | { role: 'system' | 'user' | 'assistant'; content: string }[], 
  pulse: string = 'default'
) {
  try {
    const messages = typeof prompt === 'string' 
      ? [{ role: 'user' as const, content: prompt }] 
      : prompt;

    const response = await getClient(pulse).chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
    });
    return response.choices[0].message.content || '{}';
  } catch (error: any) {
    console.error("LLM Error:", error);
    return JSON.stringify({ error: true, message: error.message });
  }
}
