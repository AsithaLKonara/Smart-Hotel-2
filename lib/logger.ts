/**
 * Native Structured Logger for Observability
 * Generates JSON-formatted logs that can be ingested by Datadog, Sentry, or ELK.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };

    // In production, we output raw JSON for log aggregators to parse.
    // In development, we can format it nicely.
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logPayload);
    } else {
      return `[${logPayload.timestamp}] ${logPayload.level}: ${message} ${context ? JSON.stringify(context) : ''} ${error ? `\n${error.stack}` : ''}`;
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, errorOrContext?: Error | unknown, context?: LogContext) {
    let errorObj: Error | undefined;
    let contextObj: LogContext | undefined = context;

    if (errorOrContext instanceof Error) {
      errorObj = errorOrContext;
    } else if (errorOrContext) {
      contextObj = { ...(errorOrContext as object), ...context };
    }

    console.error(this.formatMessage('error', message, contextObj, errorObj));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
export const log = logger;
export default logger;
