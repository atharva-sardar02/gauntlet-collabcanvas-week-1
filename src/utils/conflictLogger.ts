import type { ConflictType, ConflictResult } from './conflictDetection';

/**
 * Log level for conflict logging
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;

export type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/**
 * Conflict log entry
 */
interface ConflictLogEntry {
  timestamp: number;
  conflictType: ConflictType;
  resolution: 'remote_wins' | 'local_wins' | 'no_conflict';
  localUserId: string;
  remoteUserId: string;
  shapeIds: string[];
  severity: number;
  message: string;
  resolutionTimeMs?: number;
}

/**
 * Conflict metrics for analytics
 */
interface ConflictMetrics {
  totalConflicts: number;
  conflictsByType: Record<ConflictType, number>;
  averageResolutionTime: number;
  conflictFrequency: number; // conflicts per minute
  lastConflictTimestamp: number;
}

/**
 * Conflict logger with metrics tracking
 */
class ConflictLogger {
  private logs: ConflictLogEntry[] = [];
  private metrics: ConflictMetrics = {
    totalConflicts: 0,
    conflictsByType: {} as Record<ConflictType, number>,
    averageResolutionTime: 0,
    conflictFrequency: 0,
    lastConflictTimestamp: 0,
  };
  private isDevelopment: boolean;
  private maxLogSize: number = 1000; // Keep last 1000 logs

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Log a conflict with full details
   */
  logConflict(
    conflictType: ConflictType,
    localUserId: string,
    remoteUserId: string,
    resolution: 'remote_wins' | 'local_wins' | 'no_conflict',
    shapeIds: string[],
    severity: number,
    message?: string
  ): void {
    const entry: ConflictLogEntry = {
      timestamp: Date.now(),
      conflictType,
      resolution,
      localUserId,
      remoteUserId,
      shapeIds,
      severity,
      message: message || `Conflict: ${conflictType}`,
    };

    this.logs.push(entry);

    // Trim logs if exceeding max size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }

    // Update metrics
    this.updateMetrics(entry);

    // Console output in development mode
    if (this.isDevelopment) {
      this.logToConsole(entry);
    }
  }

  /**
   * Log a conflict from ConflictResult
   */
  logConflictResult(
    conflict: ConflictResult,
    localUserId: string,
    remoteUserId: string,
    severity: number
  ): void {
    if (!conflict.hasConflict) return;

    this.logConflict(
      conflict.type,
      localUserId,
      remoteUserId,
      conflict.resolution,
      conflict.winner?.shapeIds || [],
      severity,
      conflict.message
    );
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: ConflictLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const emoji = this.getEmojiForSeverity(entry.severity);
    
    const style = this.getConsoleStyle(entry.severity);
    
    console.groupCollapsed(
      `%c${emoji} Conflict Detected: ${entry.conflictType}`,
      style
    );
    console.log('📅 Timestamp:', timestamp);
    console.log('🔀 Type:', entry.conflictType);
    console.log('🏆 Resolution:', entry.resolution);
    console.log('👤 Local User:', entry.localUserId);
    console.log('👥 Remote User:', entry.remoteUserId);
    console.log('🎯 Shapes:', entry.shapeIds);
    console.log('⚠️ Severity:', entry.severity);
    console.log('💬 Message:', entry.message);
    if (entry.resolutionTimeMs) {
      console.log('⏱️ Resolution Time:', `${entry.resolutionTimeMs}ms`);
    }
    console.groupEnd();
  }

  /**
   * Get emoji for severity level
   */
  private getEmojiForSeverity(severity: number): string {
    if (severity >= 5) return '🔴';
    if (severity >= 4) return '🟠';
    if (severity >= 3) return '🟡';
    if (severity >= 2) return '🔵';
    return '⚪';
  }

  /**
   * Get console style for severity
   */
  private getConsoleStyle(severity: number): string {
    if (severity >= 5) return 'color: #EF4444; font-weight: bold;';
    if (severity >= 4) return 'color: #F97316; font-weight: bold;';
    if (severity >= 3) return 'color: #EAB308; font-weight: bold;';
    if (severity >= 2) return 'color: #3B82F6; font-weight: bold;';
    return 'color: #6B7280;';
  }

  /**
   * Update metrics after logging a conflict
   */
  private updateMetrics(entry: ConflictLogEntry): void {
    this.metrics.totalConflicts++;
    this.metrics.lastConflictTimestamp = entry.timestamp;

    // Update conflict count by type
    if (!this.metrics.conflictsByType[entry.conflictType]) {
      this.metrics.conflictsByType[entry.conflictType] = 0;
    }
    this.metrics.conflictsByType[entry.conflictType]++;

    // Calculate average resolution time if available
    if (entry.resolutionTimeMs) {
      const prevTotal = this.metrics.averageResolutionTime * (this.metrics.totalConflicts - 1);
      this.metrics.averageResolutionTime =
        (prevTotal + entry.resolutionTimeMs) / this.metrics.totalConflicts;
    }

    // Calculate conflict frequency (conflicts per minute)
    this.updateConflictFrequency();
  }

  /**
   * Calculate conflict frequency based on recent conflicts
   */
  private updateConflictFrequency(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentConflicts = this.logs.filter(
      (log) => log.timestamp >= oneMinuteAgo
    );

    this.metrics.conflictFrequency = recentConflicts.length;
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConflictMetrics {
    this.updateConflictFrequency(); // Update before returning
    return { ...this.metrics };
  }

  /**
   * Get all logs
   */
  getLogs(): ConflictLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by type
   */
  getLogsByType(type: ConflictType): ConflictLogEntry[] {
    return this.logs.filter((log) => log.conflictType === type);
  }

  /**
   * Get logs filtered by time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): ConflictLogEntry[] {
    return this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Get logs for a specific user
   */
  getLogsByUser(userId: string): ConflictLogEntry[] {
    return this.logs.filter(
      (log) => log.localUserId === userId || log.remoteUserId === userId
    );
  }

  /**
   * Get logs for a specific shape
   */
  getLogsByShape(shapeId: string): ConflictLogEntry[] {
    return this.logs.filter((log) => log.shapeIds.includes(shapeId));
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalConflicts: 0,
      conflictsByType: {} as Record<ConflictType, number>,
      averageResolutionTime: 0,
      conflictFrequency: 0,
      lastConflictTimestamp: 0,
    };
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        logs: this.logs,
        metrics: this.metrics,
        exportTimestamp: Date.now(),
      },
      null,
      2
    );
  }

  /**
   * Print metrics summary to console
   */
  printMetricsSummary(): void {
    if (!this.isDevelopment) return;

    console.log('\n📊 Conflict Metrics Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Conflicts: ${this.metrics.totalConflicts}`);
    console.log(`Conflict Frequency: ${this.metrics.conflictFrequency}/min`);
    console.log(
      `Average Resolution Time: ${this.metrics.averageResolutionTime.toFixed(2)}ms`
    );
    console.log('\nConflicts by Type:');
    Object.entries(this.metrics.conflictsByType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Check if conflict rate is high (potential issue)
   */
  isConflictRateHigh(): boolean {
    return this.metrics.conflictFrequency > 10; // More than 10 conflicts per minute
  }

  /**
   * Get conflict hotspots (shapes with most conflicts)
   */
  getConflictHotspots(limit: number = 5): Array<{ shapeId: string; count: number }> {
    const shapeCounts = new Map<string, number>();

    this.logs.forEach((log) => {
      log.shapeIds.forEach((shapeId) => {
        shapeCounts.set(shapeId, (shapeCounts.get(shapeId) || 0) + 1);
      });
    });

    return Array.from(shapeCounts.entries())
      .map(([shapeId, count]) => ({ shapeId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

// Singleton instance
const conflictLogger = new ConflictLogger();

// Export singleton and class
export { conflictLogger, ConflictLogger };
export type { ConflictLogEntry, ConflictMetrics };

// Convenience functions
export const logConflict = conflictLogger.logConflict.bind(conflictLogger);
export const logConflictResult = conflictLogger.logConflictResult.bind(conflictLogger);
export const getMetrics = conflictLogger.getMetrics.bind(conflictLogger);
export const getLogs = conflictLogger.getLogs.bind(conflictLogger);
export const printMetricsSummary = conflictLogger.printMetricsSummary.bind(conflictLogger);

