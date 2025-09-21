type LogLevel = 'info' | 'warn' | 'error';
type LogEvent = {
  level: LogLevel;
  msg: string;
  data?: Record<string, unknown>;
};

export const logger = {
  info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
  error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data)
};

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  const payload: LogEvent = { level, msg, data };
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  // Consola formateada
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function pickClientMeta() {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}
