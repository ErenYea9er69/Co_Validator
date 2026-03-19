import OpenAI from 'openai';
import crypto from 'crypto';
import { retryWithBackoff } from './retryHandler';

const API_KEYS = [
  process.env.LONGCAT_API_KEY || process.env.OPENAI_API_KEY || '',
  process.env.LONGCAT_API_KEY_2 || process.env.OPENAI_API_KEY_2 || '',
  process.env.LONGCAT_API_KEY_3 || process.env.OPENAI_API_KEY_3 || '',
  process.env.LONGCAT_API_KEY_4 || process.env.OPENAI_API_KEY_4 || '',
  process.env.LONGCAT_API_KEY_5 || process.env.OPENAI_API_KEY_5 || '',
].filter(Boolean);

function getKeyForPulse(pulse: string): string {
  if (API_KEYS.length === 0) return '';
  const hash = crypto.createHash('md5').update(pulse).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % API_KEYS.length;
  return API_KEYS[index];
}

const getClient = (pulse: string) => new OpenAI({
  apiKey: getKeyForPulse(pulse),
  baseURL: process.env.LONGCAT_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.longcat.chat/openai',
});

export async function think(
  prompt: string | { role: 'system' | 'user' | 'assistant'; content: string }[], 
  pulse: string = 'default'
) {
  const messages = typeof prompt === 'string' 
    ? [{ role: 'user' as const, content: prompt }] 
    : prompt;

  try {
    const response = await retryWithBackoff(async () => {
      return await getClient(pulse).chat.completions.create({
        model: process.env.LLM_MODEL || "LongCat-Flash-Chat",
        messages,
        response_format: { type: "json_object" },
      });
    }, 3, 2000);
    
    return response.choices[0].message.content || '{}';
  } catch (error: any) {
    console.error(`[LLM Error in pulse ${pulse}]:`, error);
    // Throw error so that the orchestrator's Promise.allSettled correctly detects failure
    throw new Error(`LLM Error: ${error.message || 'Unknown LLM failure'}`);
  }
}
