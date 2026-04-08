type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",   // cyan
  info: "\x1b[32m",    // green
  warn: "\x1b[33m",    // yellow
  error: "\x1b[31m",   // red
};
const RESET = "\x1b[0m";

function formatLog(level: LogLevel, module: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const color = LOG_COLORS[level];
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `${color}[${level.toUpperCase()}]${RESET} ${timestamp} [${module}] ${message}${dataStr}`;
}

export function createLogger(module: string) {
  return {
    debug: (message: string, data?: unknown) => {
      if (process.env.NODE_ENV === "development") console.debug(formatLog("debug", module, message, data));
    },
    info: (message: string, data?: unknown) => {
      console.log(formatLog("info", module, message, data));
    },
    warn: (message: string, data?: unknown) => {
      console.warn(formatLog("warn", module, message, data));
    },
    error: (message: string, data?: unknown) => {
      console.error(formatLog("error", module, message, data));
    },
  };
}
