// In-memory cache with TTL for Tavily search results
const cache = new Map<string, { data: any; expiry: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function setCachedResults(query: string, result: any) {
  const key = query.toLowerCase().trim();
  cache.set(key, { data: result, expiry: Date.now() + TTL_MS });

  // Evict expired entries (keep cache clean)
  if (cache.size > 50) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expiry < now) cache.delete(k);
    }
  }
}

export function getCachedResults(query: string): any | null {
  const key = query.toLowerCase().trim();
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  console.log(`[SearchCache] Cache HIT for "${key.substring(0, 60)}..."`);
  return entry.data;
}
