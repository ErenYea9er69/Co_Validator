import OpenAI from 'openai';

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

export async function thinkDeep(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: { jsonMode?: boolean; temperature?: number } = {}
): Promise<string> {
  const { temperature = 0.5, jsonMode = false } = options;

  try {
    const result = await getClient().chat.completions.create({
      model: 'longcat-flash-thinking-2601',
      messages,
      temperature,
      max_tokens: 16384,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    });

    return result.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    if (apiKeys.length > 1 && (error.status === 429 || error.status >= 500)) {
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    }
    throw error;
  }
}
