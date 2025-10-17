/**
 * Rate limiter for preventing excessive Firestore updates
 * Combines debouncing and throttling strategies
 */

/**
 * Queued update for a shape
 */
interface QueuedUpdate<T = any> {
  id: string;
  data: T;
  timestamp: number;
  retryCount: number;
}

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxUpdatesPerSecond?: number; // Max updates per shape per second
  debounceMs?: number; // Debounce delay for rapid updates
  throttleMs?: number; // Minimum time between updates
  maxQueueSize?: number; // Max queued updates per shape
  batchUpdates?: boolean; // Batch multiple updates into one
}

/**
 * Rate limiter for shape updates
 */
export class RateLimiter<T = any> {
  private config: Required<RateLimiterConfig>;
  private queues: Map<string, QueuedUpdate<T>[]> = new Map();
  private lastUpdateTime: Map<string, number> = new Map();
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private throttleTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private updateCounts: Map<string, number[]> = new Map(); // Timestamps of updates in last second

  constructor(config: RateLimiterConfig = {}) {
    this.config = {
      maxUpdatesPerSecond: config.maxUpdatesPerSecond || 10,
      debounceMs: config.debounceMs || 100,
      throttleMs: config.throttleMs || 100,
      maxQueueSize: config.maxQueueSize || 50,
      batchUpdates: config.batchUpdates !== false, // Default true
    };
  }

  /**
   * Queue an update with rate limiting
   * @param shapeId - ID of shape to update
   * @param data - Update data
   * @param callback - Function to execute when update is allowed
   * @returns Promise that resolves when update is sent
   */
  async queueUpdate(
    shapeId: string,
    data: T,
    callback: (data: T) => Promise<void> | void
  ): Promise<void> {
    // Check if rate limit would be exceeded
    if (this.isRateLimitExceeded(shapeId)) {
      // Queue the update for later
      this.addToQueue(shapeId, data);
      return;
    }

    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(shapeId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce: Wait for burst of updates to finish
    const debounceTimer = setTimeout(async () => {
      await this.executeUpdate(shapeId, data, callback);
      this.debounceTimers.delete(shapeId);
      
      // Process queue if any
      this.processQueue(shapeId, callback);
    }, this.config.debounceMs);

    this.debounceTimers.set(shapeId, debounceTimer);
  }

  /**
   * Execute an update immediately (bypass queue, but still track rate)
   * @param shapeId - ID of shape to update
   * @param data - Update data
   * @param callback - Function to execute
   */
  private async executeUpdate(
    shapeId: string,
    data: T,
    callback: (data: T) => Promise<void> | void
  ): Promise<void> {
    // Check throttle
    const lastUpdate = this.lastUpdateTime.get(shapeId) || 0;
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;

    if (timeSinceLastUpdate < this.config.throttleMs) {
      // Too soon, queue it
      this.addToQueue(shapeId, data);
      return;
    }

    // Execute the update
    try {
      await callback(data);
      
      // Track this update
      this.trackUpdate(shapeId);
      this.lastUpdateTime.set(shapeId, now);
    } catch (error) {
      console.error(`Error executing update for shape ${shapeId}:`, error);
      throw error;
    }
  }

  /**
   * Add update to queue
   */
  private addToQueue(shapeId: string, data: T): void {
    const queue = this.queues.get(shapeId) || [];
    
    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      console.warn(
        `Queue size limit exceeded for shape ${shapeId}, dropping oldest update`
      );
      queue.shift(); // Remove oldest
    }

    queue.push({
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    this.queues.set(shapeId, queue);
  }

  /**
   * Process queued updates for a shape
   */
  private async processQueue(
    shapeId: string,
    callback: (data: T) => Promise<void> | void
  ): Promise<void> {
    const queue = this.queues.get(shapeId);
    if (!queue || queue.length === 0) return;

    // Check if we can process now
    if (this.isRateLimitExceeded(shapeId)) {
      // Schedule retry
      setTimeout(() => {
        this.processQueue(shapeId, callback);
      }, this.config.throttleMs);
      return;
    }

    // Get next update
    const update = queue.shift();
    if (!update) return;

    this.queues.set(shapeId, queue);

    // Execute
    try {
      await this.executeUpdate(shapeId, update.data, callback);
      
      // Process next if any
      if (queue.length > 0) {
        setTimeout(() => {
          this.processQueue(shapeId, callback);
        }, this.config.throttleMs);
      }
    } catch (error) {
      console.error('Error processing queued update:', error);
      
      // Retry logic
      if (update.retryCount < 3) {
        update.retryCount++;
        queue.unshift(update); // Add back to front
        this.queues.set(shapeId, queue);
        
        // Retry after delay
        setTimeout(() => {
          this.processQueue(shapeId, callback);
        }, 1000);
      }
    }
  }

  /**
   * Check if rate limit is exceeded for a shape
   */
  private isRateLimitExceeded(shapeId: string): boolean {
    const counts = this.updateCounts.get(shapeId) || [];
    const now = Date.now();
    
    // Remove timestamps older than 1 second
    const recentCounts = counts.filter((ts) => now - ts < 1000);
    this.updateCounts.set(shapeId, recentCounts);

    return recentCounts.length >= this.config.maxUpdatesPerSecond;
  }

  /**
   * Track an update for rate limiting
   */
  private trackUpdate(shapeId: string): void {
    const counts = this.updateCounts.get(shapeId) || [];
    counts.push(Date.now());
    this.updateCounts.set(shapeId, counts);
  }

  /**
   * Get queue size for a shape
   */
  getQueueSize(shapeId: string): number {
    return this.queues.get(shapeId)?.length || 0;
  }

  /**
   * Get total queue size across all shapes
   */
  getTotalQueueSize(): number {
    return Array.from(this.queues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0
    );
  }

  /**
   * Check if shape has queued updates
   */
  hasQueuedUpdates(shapeId: string): boolean {
    return this.getQueueSize(shapeId) > 0;
  }

  /**
   * Get update rate for a shape (updates per second)
   */
  getUpdateRate(shapeId: string): number {
    const counts = this.updateCounts.get(shapeId) || [];
    const now = Date.now();
    const recentCounts = counts.filter((ts) => now - ts < 1000);
    return recentCounts.length;
  }

  /**
   * Clear queue for a shape
   */
  clearQueue(shapeId: string): void {
    this.queues.delete(shapeId);
    
    const timer = this.debounceTimers.get(shapeId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(shapeId);
    }
  }

  /**
   * Clear all queues
   */
  clearAllQueues(): void {
    this.queues.clear();
    
    // Clear all timers
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    
    this.throttleTimers.forEach((timer) => clearTimeout(timer));
    this.throttleTimers.clear();
  }

  /**
   * Flush queue immediately (bypass rate limiting)
   * Useful for cleanup or urgent updates
   */
  async flushQueue(
    shapeId: string,
    callback: (data: T) => Promise<void> | void
  ): Promise<void> {
    const queue = this.queues.get(shapeId);
    if (!queue || queue.length === 0) return;

    // Process all queued updates
    for (const update of queue) {
      try {
        await callback(update.data);
      } catch (error) {
        console.error('Error flushing queue:', error);
      }
    }

    this.clearQueue(shapeId);
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    totalQueued: number;
    queuesByShape: Map<string, number>;
    updateRates: Map<string, number>;
  } {
    const queuesByShape = new Map<string, number>();
    this.queues.forEach((queue, shapeId) => {
      queuesByShape.set(shapeId, queue.length);
    });

    const updateRates = new Map<string, number>();
    this.updateCounts.forEach((_counts, shapeId) => {
      updateRates.set(shapeId, this.getUpdateRate(shapeId));
    });

    return {
      totalQueued: this.getTotalQueueSize(),
      queuesByShape,
      updateRates,
    };
  }

  /**
   * Cleanup old data
   */
  cleanup(): void {
    const now = Date.now();
    const oldThreshold = now - 5000; // 5 seconds

    // Clean up old update counts
    this.updateCounts.forEach((counts, shapeId) => {
      const recentCounts = counts.filter((ts) => ts > oldThreshold);
      if (recentCounts.length === 0) {
        this.updateCounts.delete(shapeId);
      } else {
        this.updateCounts.set(shapeId, recentCounts);
      }
    });

    // Clean up old last update times
    this.lastUpdateTime.forEach((timestamp, shapeId) => {
      if (timestamp < oldThreshold) {
        this.lastUpdateTime.delete(shapeId);
      }
    });
  }
}

/**
 * Create a debounced function
 * Simpler alternative to RateLimiter for single function debouncing
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delayMs);
  };
}

/**
 * Create a throttled function
 * Ensures function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  intervalMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= intervalMs) {
      // Enough time has passed, execute immediately
      lastCallTime = now;
      func(...args);
    } else {
      // Too soon, schedule for later
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        func(...args);
        timeoutId = null;
      }, intervalMs - timeSinceLastCall);
    }
  };
}

/**
 * Batch multiple updates into one
 * Collects updates over a time window and executes them together
 */
export class UpdateBatcher<T = any> {
  private batches: Map<string, T[]> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private batchDelayMs: number;

  constructor(batchDelayMs: number = 100) {
    this.batchDelayMs = batchDelayMs;
  }

  /**
   * Add update to batch
   */
  add(
    batchId: string,
    update: T,
    callback: (batch: T[]) => Promise<void> | void
  ): void {
    // Add to batch
    const batch = this.batches.get(batchId) || [];
    batch.push(update);
    this.batches.set(batchId, batch);

    // Clear existing timer
    const existingTimer = this.timers.get(batchId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await this.executeBatch(batchId, callback);
    }, this.batchDelayMs);

    this.timers.set(batchId, timer);
  }

  /**
   * Execute a batch
   */
  private async executeBatch(
    batchId: string,
    callback: (batch: T[]) => Promise<void> | void
  ): Promise<void> {
    const batch = this.batches.get(batchId);
    if (!batch || batch.length === 0) return;

    try {
      await callback(batch);
      this.batches.delete(batchId);
      this.timers.delete(batchId);
    } catch (error) {
      console.error('Error executing batch:', error);
      throw error;
    }
  }

  /**
   * Flush batch immediately
   */
  async flush(
    batchId: string,
    callback: (batch: T[]) => Promise<void> | void
  ): Promise<void> {
    const timer = this.timers.get(batchId);
    if (timer) {
      clearTimeout(timer);
    }
    await this.executeBatch(batchId, callback);
  }

  /**
   * Get batch size
   */
  getBatchSize(batchId: string): number {
    return this.batches.get(batchId)?.length || 0;
  }

  /**
   * Clear batch
   */
  clear(batchId: string): void {
    const timer = this.timers.get(batchId);
    if (timer) {
      clearTimeout(timer);
    }
    this.batches.delete(batchId);
    this.timers.delete(batchId);
  }
}

