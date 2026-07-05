/**
 * Native Structured Logger for Observability
 * Generates JSON-formatted logs that can be ingested by Datadog, Sentry, or ELK.
 */

import * as Sentry from '@sentry/nextjs';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private getRequestId(context?: LogContext): string | undefined {
    if (context && context.requestId) {
      return String(context.requestId);
    }
    return undefined;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const requestId = this.getRequestId(context);
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      requestId,
      context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };

    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logPayload);
    } else {
      return `[${logPayload.timestamp}] ${requestId ? `[${requestId}] ` : ''}${logPayload.level}: ${message} ${context ? JSON.stringify(context) : ''} ${error ? `\n${error.stack}` : ''}`;
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

    const requestId = this.getRequestId(contextObj);
    if (requestId) {
      Sentry.setTag('request_id', requestId);
    }

    if (contextObj) {
      Sentry.setContext('custom_context', contextObj);
      // Tag specific resource IDs for easy querying in Sentry
      if (contextObj.bookingId) Sentry.setTag('bookingId', String(contextObj.bookingId));
      if (contextObj.userId) Sentry.setTag('userId', String(contextObj.userId));
      if (contextObj.roomId) Sentry.setTag('roomId', String(contextObj.roomId));
    }

    if (errorObj) {
      Sentry.captureException(errorObj);
    } else {
      Sentry.captureMessage(message, 'error');
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
