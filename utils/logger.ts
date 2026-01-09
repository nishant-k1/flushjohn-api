/**
 * Logger Utility
 * Provides consistent logging with log levels and environment-aware output
 * 
 * CRITICAL FIX: Replaces console.log with proper logging utility
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Logger class for consistent logging across the application
 */
class Logger {
  /**
   * Log debug messages (only in development)
   */
  debug(message: string, ...args: any[]): void {
    if (isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, ...args: any[]): void {
    console.log(`ℹ️  [INFO] ${message}`, ...args);
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`⚠️  [WARN] ${message}`, ...args);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: any, ...args: any[]): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : error;
    
    console.error(`❌ [ERROR] ${message}`, errorDetails, ...args);
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, ...args: any[]): void {
    if (isDevelopment) {
      console.log(`⏱️  [PERF] ${operation}: ${duration}ms`, ...args);
    }
  }
}

export const logger = new Logger();
export default logger;
