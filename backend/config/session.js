import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import { env } from './env.js';

export const SESSION_COOKIE_NAME = 'opencare.sid';

/**
 * Session middleware backed by MongoDB.
 *
 * Must be created *after* the database connection exists, because the store
 * reuses the Mongoose client instead of opening a second connection pool.
 *
 * Sessions are the only place authentication state lives. Nothing about the
 * session is exposed to JavaScript: the cookie is httpOnly.
 */
export function createSessionMiddleware() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('createSessionMiddleware() called before MongoDB connected.');
  }

  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    dbName: env.mongoDbName,
    collectionName: 'sessions',
    ttl: Math.floor(env.sessionMaxAgeMs / 1000),
    autoRemove: 'native',
  });

  store.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('[session-store]', error?.message ?? error);
  });

  const middleware = session({
    name: SESSION_COOKIE_NAME,
    secret: env.sessionSecret,
    store,
    // Do not touch unchanged sessions, and do not create one for every visitor.
    resave: false,
    saveUninitialized: false,
    // Sliding expiry: an active user is not logged out mid-session.
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.sessionCookieSecure,
      maxAge: env.sessionMaxAgeMs,
      path: '/',
    },
  });

  middleware.store = store;
  return middleware;
}

/** Options that must match the cookie exactly when clearing it. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.sessionCookieSecure,
    path: '/',
  };
}
