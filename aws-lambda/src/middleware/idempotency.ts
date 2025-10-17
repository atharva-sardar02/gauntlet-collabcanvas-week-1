/**
 * Idempotency Middleware
 * Caches AI command results by requestId to prevent duplicate operations
 * 
 * Cache TTL: 5 minutes
 * Use case: Retry requests with same requestId return cached result
 */

interface CachedResult {
  result: any;
  expiresAt: number;
}

// In-memory cache for idempotency
const cache = new Map<string, CachedResult>();

// Cache configuration
const CACHE_TTL_MS = 300000; // 5 minutes

/**
 * Get cached result for request ID
 * @param requestId - Unique request identifier from client
 * @returns Cached result or null if not found/expired
 */
export function getCachedResult(requestId: string): any | null {
  const cached = cache.get(requestId);
  
  if (!cached) {
    return null;
  }

  // Check if expired
  if (cached.expiresAt < Date.now()) {
    cache.delete(requestId);
    return null;
  }

  console.log(`Idempotency: Returning cached result for requestId ${requestId}`);
  return cached.result;
}

/**
 * Cache result for request ID
 * @param requestId - Unique request identifier
 * @param result - Result to cache
 */
export function cacheResult(requestId: string, result: any): void {
  cache.set(requestId, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  console.log(`Idempotency: Cached result for requestId ${requestId}`);
}

/**
 * Clean up expired cache entries (called periodically)
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [requestId, cached] of cache.entries()) {
    if (cached.expiresAt < now) {
      cache.delete(requestId);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredCache, 300000);


