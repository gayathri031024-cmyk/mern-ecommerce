/* eslint-disable no-console */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[35m',
};
const RESET = '\x1b[0m';

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  const prefix = `${COLORS[level]}[${level.toUpperCase()}]${RESET} ${timestamp()} -`;
  if (meta !== undefined) console[level === 'debug' ? 'log' : level](prefix, message, meta);
  else console[level === 'debug' ? 'log' : level](prefix, message);
}

export const logger = {
  info: (message: string, meta?: unknown): void => write('info', message, meta),
  warn: (message: string, meta?: unknown): void => write('warn', message, meta),
  error: (message: string, meta?: unknown): void => write('error', message, meta),
  debug: (message: string, meta?: unknown): void => write('debug', message, meta),
};