import isElectron from "is-electron";

// Define log levels
export type LogLevel = "info" | "warn" | "error" | "debug";

class Logger {
  private isDebugEnabled: boolean = false;

  constructor() {
    this.isDebugEnabled = localStorage.getItem("debug_logging") === "true";
  }

  public enableDebug() {
    this.isDebugEnabled = true;
    localStorage.setItem("debug_logging", "true");
    this.info("Debug logging enabled");
  }

  public disableDebug() {
    this.isDebugEnabled = false;
    localStorage.removeItem("debug_logging");
    this.info("Debug logging disabled");
  }

  public log(level: LogLevel, message: string, ...args: unknown[]) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (level === "debug" && !this.isDebugEnabled) {
      return;
    }

    if (isElectron()) {
      try {
        // Dynamic import to avoid bundling issues in pure web build if not handled
        // However, standard import is usually fine if bundler handles 'fs' shim
        // We will stick to console for web, and let electron-preload handle file logs if needed
        // For this task, we'll just console log with structure, as electron-log is node-heavy
        // If we strictly want electron-log, we'd use window.electron.log if exposed
        console[
          level === "error" ? "error" : level === "warn" ? "warn" : "log"
        ](prefix, message, ...args);
      } catch (e) {
        console.error("Logger error", e);
      }
    } else {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        prefix,
        message,
        ...args,
      );
    }
  }

  public info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    this.log("error", message, ...args);
  }

  public debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }
}

export const logger = new Logger();
