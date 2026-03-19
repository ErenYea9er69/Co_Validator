import OpenAI from 'openai';
import { retryWithBackoff } from './retryHandler';

const apiKeys = [
  process.env.LONGCAT_API_KEY,
  process.env.LONGCAT_API_KEY_2,
  process.env.LONGCAT_API_KEY_3,
  process.env.LONGCAT_API_KEY_4,
  process.env.LONGCAT_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getClient(): OpenAI {
  if (apiKeys.length === 0) throw new Error('No LongCat API keys provided in .env');
  return new OpenAI({
    apiKey: apiKeys[currentKeyIndex],
    baseURL: 'https://api.longcat.chat/openai',
    timeout: 300000,
  });
}

function rotateKey() {
  if (apiKeys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  }
}

export interface AIResult {
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function think(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: { jsonMode?: boolean; temperature?: number; maxTokens?: number } = {}
): Promise<AIResult> {
  const { temperature = 0.5, jsonMode = false, maxTokens = 16384 } = options;

  return retryWithBackoff(async () => {
    try {
      const result = await getClient().chat.completions.create({
        model: 'longcat-flash-thinking-2601',
        messages,
        temperature,
        max_tokens: maxTokens,
        ...(jsonMode && { response_format: { type: 'json_object' } }),
      });
      
      return {
        content: result.choices?.[0]?.message?.content || '',
        usage: {
          prompt_tokens: result.usage?.prompt_tokens || 0,
          completion_tokens: result.usage?.completion_tokens || 0,
          total_tokens: result.usage?.total_tokens || 0,
        }
      };
    } catch (error: any) {
      if (error.status === 429 || error.status >= 500) rotateKey();
      throw error;
    }
  }, 3);
}

