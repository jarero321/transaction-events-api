export const LOGGER_PORT = Symbol('LOGGER_PORT');

export interface LogContext {
  transactionId?: string;
  eventId?: string;
  eventType?: string;
  [key: string]: unknown;
}

export interface LoggerPort {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}
