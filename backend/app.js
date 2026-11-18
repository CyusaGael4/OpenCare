import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { env } from './config/env.js';
import { createSessionMiddleware } from './config/session.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { ensureCsrfToken, requireCsrf } from './middleware/csrf.js';
import { loadUser } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimits.js';
import { logger } from './utils/logger.js';

/**
 * Build the Express application.
 *
 * A factory rather than a module-level singleton because the session store
 * reuses the Mongoose client, so it can only be created once the database is
 * connected. server.js calls this after connecting.
 */
export function createApp() {
  const app = express();

  // Do not advertise the framework.
  app.disable('x-powered-by');

  // Behind a reverse proxy (production) the client IP arrives via
  // X-Forwarded-For. Required for correct rate limiting and Secure cookies.
  if (env.isProduction) app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: env.isProduction ? undefined : false,
    }),
  );

  /*
   * Credentialed CORS limited to an explicit allowlist. Requests without an
   * Origin header (curl, health probes, same-origin server calls) are allowed
   * through; a foreign Origin simply receives no CORS headers, so the browser
   * blocks the response instead of the API crashing.
   */
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, env.allowedOrigins.includes(origin.replace(/\/$/, '')));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
      maxAge: 600,
    }),
  );

  // Small JSON limits: none of our endpoints accept large payloads.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Before anything expensive: reject abusive traffic early.
  app.use(apiLimiter);

  if (env.isDevelopment) {
    app.use((req, res, next) => {
      const startedAt = process.hrtime.bigint();
      res.on('finish', () => {
        const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
        logger.debug(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)}ms)`);
      });
      next();
    });
  }

  // Session → CSRF token → CSRF enforcement → identity resolution.
  app.use(createSessionMiddleware());
  app.use(ensureCsrfToken);
  app.use(requireCsrf);
  app.use(loadUser);

  app.use('/api', apiRouter);

  // Anything unmatched is a JSON 404; errors end up in one handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
