import { createLogger, format, transports } from 'winston';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

// Custom format for development
const customFormat = format.printf(({ level, message }) => {
  const levelUpper = level.toUpperCase();
  return `[${levelUpper}] ${message}`;
});

export const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    isProduction ? format.json() : customFormat
  ),
  transports: [new transports.Console()],
});
