import * as Sentry from '@sentry/node';

/**
 * Sentry Server Monitoring Wrapper
 */
export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || dsn.includes('placeholder')) {
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

export function captureServerException(error: unknown) {
  // TODO: Send exception to Sentry in Phase 6
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry Server Stub] Error captured:', error);
  }
}
