import type { TMCLoggingLevel } from "../MeteorConnect.types.ts";

/**
 * Centralized logging utility for MeteorConnect
 * Manages global logging level and provides customized logger instances
 */
export class MeteorLogger {
  private static globalLoggingLevel: TMCLoggingLevel = "basic";

  /**
   * Set the global logging level for all logger instances
   */
  static setGlobalLoggingLevel(level: TMCLoggingLevel): void {
    MeteorLogger.globalLoggingLevel = level;
  }

  /**
   * Get the current global logging level
   */
  static getGlobalLoggingLevel(): TMCLoggingLevel {
    return MeteorLogger.globalLoggingLevel;
  }

  /**
   * Create a new logger instance with a custom prefix
   * @param prefix - The prefix to use for log messages (e.g., "MeteorConnect", "MeteorConnect [ExecutableAction]")
   */
  static createLogger(prefix: string): LoggerInstance {
    return new LoggerInstance(prefix);
  }
}

/**
 * Logger instance with customized prefix
 */
export class LoggerInstance {
  constructor(private readonly prefix: string) {}

  /**
   * Log a message respecting the global logging level
   * @param message - The message to log
   * @param meta - Optional metadata to log in debug mode
   */
  log(message: string, meta?: any): void {
    const level = MeteorLogger.getGlobalLoggingLevel();

    if (level === "none") {
      return;
    }

    if (level === "basic" || meta == null) {
      console.log(this.formatMsg(message));
      return;
    }

    if (level === "debug") {
      console.log(this.formatMsg(message), meta);
      return;
    }
  }

  formatMsg(message: string): string {
    return `[${this.prefix}]: ${message}`;
  }
}
