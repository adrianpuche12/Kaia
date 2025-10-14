// Sistema de logging estructurado
import { config } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  metadata?: any;
}

class Logger {
  private isDevelopment = config.nodeEnv === 'development';

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, metadata } = entry;
    const meta = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${meta}`;
  }

  private log(level: LogLevel, message: string, metadata?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      default:
        console.log(formatted);
    }
  }

  info(message: string, metadata?: any) {
    this.log('info', message, metadata);
  }

  warn(message: string, metadata?: any) {
    this.log('warn', message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: any) {
    const errorData = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    this.log('error', message, { ...metadata, error: errorData });
  }

  debug(message: string, metadata?: any) {
    this.log('debug', message, metadata);
  }

  // Logs específicos para el dominio de Kaia
  voiceCommand(userId: string, transcript: string, intent: string, success: boolean) {
    this.info('Voice command processed', {
      userId,
      transcript,
      intent,
      success,
    });
  }

  mcpExecution(mcpId: string, userId: string, success: boolean, executionTimeMs: number) {
    this.info('MCP executed', {
      mcpId,
      userId,
      success,
      executionTimeMs,
    });
  }

  apiRequest(method: string, path: string, statusCode: number, duration: number) {
    this.info('API request', {
      method,
      path,
      statusCode,
      duration,
    });
  }

  authEvent(userId: string, event: 'login' | 'register' | 'logout', success: boolean) {
    this.info('Auth event', {
      userId,
      event,
      success,
    });
  }
}

export const logger = new Logger();
export default logger;
