import { tavily } from '@tavily/core';
import { retryWithBackoff } from './retryHandler';
import { getCachedResults, setCachedResults } from './searchCache';

const apiKeys = [
  process.env.TAVILY_API_KEY,
  process.env.TAVILY_API_KEY_2,
  process.env.TAVILY_API_KEY_3,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getClient() {
  if (apiKeys.length === 0) throw new Error('No Tavily API keys provided');
  return tavily({ apiKey: apiKeys[currentKeyIndex] });
}

let totalCreditsUsed = 0;

export function getTavilyCredits() {
  return totalCreditsUsed;
}

export function resetCreditCounter() {
  totalCreditsUsed = 0;
}

const STARTUP_DOMAINS = [
  'producthunt.com',
  'crunchbase.com',
  'indiehackers.com',
  'g2.com',
  'capterra.com',
  'ycombinator.com',
  'betalist.com',
  'alternativeto.net',
];

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface SearchOptions {
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  topic?: 'general' | 'news';
  timeRange?: 'day' | 'week' | 'month' | 'year';
  includeAnswer?: boolean;
  useCache?: boolean;
}

async function search(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResult[]; answer?: string }> {
  // Tavily has a 400 character limit for queries
  const safeQuery = query.length > 400 ? query.substring(0, 400) : query;
  
  const {
    searchDepth = 'advanced',
    maxResults = 10,
    includeDomains,
    excludeDomains,
    topic = 'general',
    timeRange,
    includeAnswer = false,
    useCache = true,
  } = options;

  if (useCache) {
    const cached = await getCachedResults(safeQuery);
    if (cached) return cached as { results: SearchResult[]; answer?: string };
  }

  const response = await retryWithBackoff(async () => {
    try {
      const hasDateOperators = /\b(after:|before:|since:|until:)\b/i.test(query);
      const activeOptions = {
        searchDepth,
        maxResults,
        ...(includeDomains && { includeDomains }),
        ...(excludeDomains && { excludeDomains }),
        topic,
        ...(includeAnswer && { includeAnswer: true }),
      };

      if (timeRange) {
        if (hasDateOperators) {
          console.warn(`[Tavily] Query contains date operators. Skipping timeRange: "${timeRange}" for query: "${query}"`);
        } else {
          (activeOptions as any).timeRange = timeRange;
        }
      }

      const res = await getClient().search(safeQuery, activeOptions);
      return res;
    } catch (error: any) {
      console.error(`[Tavily] Search error for query "${safeQuery}":`, error?.message || error);
      
      if (apiKeys.length > 1) {
        const prevIndex = currentKeyIndex;
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        console.log(`[Tavily] Switching API Key: ${prevIndex + 1} -> ${currentKeyIndex + 1}/${apiKeys.length}`);
      }
      throw error;
    }
  }, 3);

  totalCreditsUsed += searchDepth === 'advanced' ? 2 : 1;

  const result = {
    results: (response.results || []).map((r: Record<string, unknown>) => ({
      title: String(r.title || ''),
      url: String(r.url || ''),
      content: String(r.content || ''),
      score: Number(r.score || 0),
    })),
    answer: typeof response.answer === 'string' ? response.answer : undefined,
  };

  console.log(`[Tavily] Search success for "${safeQuery}". Results: ${result.results.length}, Answer: ${result.answer ? 'Yes' : 'No'}`);

  if (useCache) {
    await setCachedResults(safeQuery, result);
  }

  return result;
}

export async function searchMarketGaps(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResult[]; answer?: string }> {
  return search(query, {
    searchDepth: 'advanced',
    maxResults: 10,
    includeAnswer: true,
    ...options,
  });
}

// FIX: Smarter competitor search — uses user's known competitor names + industry landscape
export async function searchCompetitors(
  ideaName: string,
  industry: string,
  userCompetitorInfo: string = ''
): Promise<{ results: SearchResult[]; answer?: string }> {
  // Extract potential competitor names from user input
  const competitorNames = userCompetitorInfo
    .split(/[,.\n;]/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && s.length < 40)
    .slice(0, 3)
    .join(' OR ');

  const query = competitorNames
    ? `${competitorNames} ${industry} startup competitor analysis market share`
    : `${industry} top competitors startups tools platforms ${new Date().getFullYear()}`;

  return search(query, {
    searchDepth: 'advanced',
    maxResults: 10,
    includeAnswer: true,
  });
}

export async function searchStartupEcosystem(
  query: string
): Promise<{ results: SearchResult[]; answer?: string }> {
  return search(query, {
    searchDepth: 'basic',
    maxResults: 15,
    includeDomains: STARTUP_DOMAINS,
  });
}

export async function searchTrends(
  industry: string
): Promise<{ results: SearchResult[]; answer?: string }> {
  const year = new Date().getFullYear();
  const nextYear = year + 1;
  return search(`${industry} startup trends ${year} ${nextYear} emerging opportunities`, {
    searchDepth: 'basic',
    maxResults: 10,
    topic: 'news',
    timeRange: 'month',
    includeAnswer: true,
  });
}

// FIX: Smarter problem search — no quotes, searches for the pain not the idea
export async function verifyProblem(
  problem: string,
  industry: string
): Promise<{ results: SearchResult[]; answer?: string }> {
  // Extract key pain phrases (first 100 chars) without wrapping in quotes
  const painCore = problem.substring(0, 120).replace(/"/g, '');
  return search(`${painCore} ${industry} user frustration complaints market demand`, {
    searchDepth: 'advanced',
    maxResults: 8,
    includeAnswer: true,
  });
}

// FIX: Smarter pricing search — industry benchmarks, not nonexistent product pricing
export async function searchPricing(
  ideaName: string,
  industry: string
): Promise<{ results: SearchResult[]; answer?: string }> {
  return search(`${industry} SaaS pricing benchmarks average revenue per user ARPU market size ${new Date().getFullYear()}`, {
    searchDepth: 'basic',
    maxResults: 8,
    includeAnswer: true,
  });
}

export async function lightningSearch(query: string): Promise<{ results: SearchResult[]; answer?: string }> {
  return search(query, {
    searchDepth: 'basic',
    maxResults: 5,
    includeAnswer: true,
    timeRange: 'week',
  });
}

export async function deepScrape(urls: string[]): Promise<any[]> {
  if (urls.length === 0) return [];
  
  const response = await retryWithBackoff(async () => {
    try {
      const res = await getClient().extract(urls);
      return res;
    } catch (error: any) {
      console.error(`[Tavily] Extract error:`, error?.message || error);
      throw error;
    }
  }, 2);

  return (response.results || []).map((r: any) => ({
    url: r.url,
    rawContent: r.rawContent || r.content || ''
  }));
}
