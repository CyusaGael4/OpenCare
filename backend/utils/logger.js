const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const configuredLevel = (process.env.LOG_LEVEL ?? '').toLowerCase();
const threshold = LEVELS[configuredLevel] ?? (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

function write(level, message, meta) {
  if (LEVELS[level] > threshold) return;
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (meta !== undefined) sink(line, meta);
  else sink(line);
}

/*
 * Minimal dependency-free logger. Credentials must never reach it: callers pass
 * descriptive metadata only (hosts, counts, status codes), never URIs or secrets.
 */
export const logger = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
};
