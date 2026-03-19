import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join('/tmp', 'tavily-cache.json');
const TTL_MS = 30 * 60 * 1000; // 30 minutes for persistent cache

function readCache(): Map<string, { data: any; expiry: number }> {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const content = fs.readFileSync(CACHE_FILE, 'utf-8');
            const parsed = JSON.parse(content);
            return new Map(Object.entries(parsed));
        }
    } catch (e) {
        console.warn('[SearchCache] Failed to read disk cache:', e);
    }
    return new Map();
}

function writeCache(cache: Map<string, any>) {
    try {
        const obj = Object.fromEntries(cache);
        fs.writeFileSync(CACHE_FILE, JSON.stringify(obj), 'utf-8');
    } catch (e) {
        console.warn('[SearchCache] Failed to write disk cache:', e);
    }
}

export function setCachedResults(query: string, result: any) {
  const key = query.toLowerCase().trim();
  const cache = readCache();
  cache.set(key, { data: result, expiry: Date.now() + TTL_MS });

  // Evict expired / keep size reasonable
  if (cache.size > 100) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (v.expiry < now) cache.delete(k);
    }
  }
  writeCache(cache);
}

export function getCachedResults(query: string): any | null {
  const key = query.toLowerCase().trim();
  const cache = readCache();
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    writeCache(cache);
    return null;
  }
  console.log(`[SearchCache] Disk HIT for "${key.substring(0, 60)}..."`);
  return entry.data;
}
