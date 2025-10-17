/**
 * Rate Limiting Middleware
 * Limits users to 20 requests per minute
 * 
 * NOTE: This is an in-memory implementation for single Lambda instance.
 * For production with multiple instances, use DynamoDB or ElastiCache.
 */

interface RateLimit {
  count: number;
  resetAt: number;
}

// In-memory rate limit storage
const rateLimits = new Map<string, RateLimit>();

// Rate limit configuration
const MAX_REQUESTS_PER_WINDOW = 20;
const WINDOW_DURATION_MS = 60000; // 1 minute

/**
 * Check if user has exceeded rate limit
 * @param userId - User ID (from Firebase token)
 * @returns true if allowed, false if rate limit exceeded
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(userId);

  // No existing limit or window expired - allow and reset
  if (!limit || limit.resetAt < now) {
    rateLimits.set(userId, {
      count: 1,
      resetAt: now + WINDOW_DURATION_MS,
    });
    return true;
  }

  // Within window - check count
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) {
    console.log(`Rate limit exceeded for user ${userId}: ${limit.count}/${MAX_REQUESTS_PER_WINDOW}`);
    return false;
  }

  // Increment count
  limit.count++;
  return true;
}

/**
 * Get remaining requests for user (for debugging)
 */
export function getRemainingRequests(userId: string): number {
  const limit = rateLimits.get(userId);
  if (!limit || limit.resetAt < Date.now()) {
    return MAX_REQUESTS_PER_WINDOW;
  }
  return Math.max(0, MAX_REQUESTS_PER_WINDOW - limit.count);
}

/**
 * Clean up expired rate limits (called periodically)
 */
export function cleanupExpiredLimits(): void {
  const now = Date.now();
  for (const [userId, limit] of rateLimits.entries()) {
    if (limit.resetAt < now) {
      rateLimits.delete(userId);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredLimits, 300000);


