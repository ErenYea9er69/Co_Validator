import { tavily } from '@tavily/core';
import { retryWithBackoff } from './retryHandler';
import { getCachedResults, setCachedResults } from './searchCache';
import crypto from 'crypto';

const API_KEYS = [
  process.env.TAVILY_API_KEY || '',
  process.env.TAVILY_API_KEY_2 || '',
  process.env.TAVILY_API_KEY_3 || '',
  process.env.TAVILY_API_KEY_4 || '',
  process.env.TAVILY_API_KEY_5 || '',
].filter(Boolean);

function getClient(pulse: string): any {
  if (API_KEYS.length === 0) return null;
  const hash = crypto.createHash('md5').update(pulse).digest('hex');
  const index = parseInt(hash.substring(0, 8), 16) % API_KEYS.length;
  return tavily({ apiKey: API_KEYS[index] });
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
  'news.ycombinator.com'
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

export async function search(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResult[]; answer?: string }> {
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

      if (timeRange && !hasDateOperators) {
        (activeOptions as any).timeRange = timeRange;
      }

      const client = getClient(safeQuery);
      if (!client) throw new Error('No Tavily API client available');
      return await client.search(safeQuery, activeOptions);
    } catch (error: any) {
      console.error(`[Tavily] Search error for query "${safeQuery}":`, error?.message || error);
      throw error;
    }
  }, 3);

  totalCreditsUsed += searchDepth === 'advanced' ? 2 : 1;

  const result = {
    results: (response.results || []).map((r: any) => ({
      title: String(r.title || ''),
      url: String(r.url || ''),
      content: String(r.content || r.raw_content || ''),
      score: Number(r.score || 0),
    })),
    answer: typeof response.answer === 'string' ? response.answer : undefined,
  };

  if (useCache) {
    await setCachedResults(safeQuery, result);
  }

  return result;
}

export async function searchMarketGaps(query: string) {
  return search(query, { searchDepth: 'advanced', maxResults: 10, includeAnswer: true });
}

export async function searchCompetitors(ideaName: string, industry: string, userCompetitorInfo: string = '') {
  const competitorNames = userCompetitorInfo.split(/[,.\n;]/).map(s => s.trim()).filter(s => s.length > 2).slice(0, 3).join(' OR ');
  const query = competitorNames ? `${competitorNames} ${industry} startup competitors` : `${industry} top startups competitors ${new Date().getFullYear()}`;
  return search(query, { searchDepth: 'advanced', maxResults: 10, includeAnswer: true });
}

export async function verifyProblem(problem: string, industry: string) {
  const painCore = problem.substring(0, 120).replace(/"/g, '');
  return search(`${painCore} ${industry} user frustration complaints market demand`, { searchDepth: 'advanced', maxResults: 8, includeAnswer: true });
}

export async function searchPricing(ideaName: string, industry: string) {
  return search(`${industry} SaaS pricing benchmarks ARPU ${new Date().getFullYear()}`, { searchDepth: 'basic', maxResults: 8, includeAnswer: true });
}

export async function searchSyntheticPrimary(queries: string[]): Promise<{ results: SearchResult[] }> {
  // Fix 9: Parallelize sequential Tavily searches
  const results = await Promise.all(
    queries.slice(0, 3).map(q => search(q, { searchDepth: 'advanced', maxResults: 5, includeDomains: STARTUP_DOMAINS, useCache: true }))
  );
  return { results: results.flatMap(r => r.results) };
}

export async function deepScrape(urls: string[]): Promise<string> {
  if (urls.length === 0) return "";
  const client = getClient(urls.join('|'));
  if (!client) return "";
  try {
    const results = await client.extract(urls);
    return (results.results || []).map((r: any) => r.raw_content || r.content || "").join("\n\n---\n\n");
  } catch (e) {
    console.error("DeepScrape failed:", e);
    return "";
  }
}
