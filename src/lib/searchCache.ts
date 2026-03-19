import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'tmp', 'tavily-cache.json');
const memCache = new Map<string, { data: any; expiry: number }>();
let diskLoaded = false;

// Ensure tmp directory exists
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  } catch (e) {}
}

function ensureDiskLoaded() {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(content);
      Object.entries(data).forEach(([k, v]: [string, any]) => {
        memCache.set(k, v);
      });
    }
  } catch (e) {
    console.warn("Failed to load search cache from disk:", e);
  }
}

async function flushToDisk() {
  try {
    const data = Object.fromEntries(memCache.entries());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write search cache to disk:", e);
  }
}

export function getCachedResults(query: string): any | null {
  ensureDiskLoaded();
  const cached = memCache.get(query);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  return null;
}

export function setCachedResults(query: string, data: any): void {
  ensureDiskLoaded();
  memCache.set(query, {
    data,
    expiry: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
  });
  // Fire and forget disk write
  flushToDisk();
}
