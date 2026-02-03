import { Injectable } from '@nestjs/common';
import { LoggerPort, LogContext } from '../../../application/ports/logger.port';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class StructuredLoggerService implements LoggerPort {
  private readonly serviceName = 'transaction-api';

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
    };

    if (context) {
      structuredLog.context = context;
    }

    if (error) {
      structuredLog.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const output = JSON.stringify(structuredLog);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }
}
