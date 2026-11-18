import User from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Resolve req.user from the session, if there is one.
 *
 * Runs on every request so handlers and guards can trust `req.user`. An account
 * that was deactivated or deleted mid-session is signed out immediately rather
 * than continuing with a stale identity.
 */
export const loadUser = asyncHandler(async (req, _res, next) => {
  req.user = null;

  const userId = req.session?.userId;
  if (!userId) return next();

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    await destroySession(req);
    return next();
  }

  req.user = user;
  return next();
});

export function destroySession(req) {
  return new Promise((resolve) => {
    if (!req.session) return resolve();
    req.session.destroy(() => resolve());
  });
}

/* Authorisation is decided here, on the server. Frontend route guards only
 * shape the experience; they are never the security boundary. */

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(HttpError.unauthorized('Please sign in to continue.'));
  }
  return next();
}

export function requirePatient(req, _res, next) {
  if (!req.user) return next(HttpError.unauthorized('Please sign in to continue.'));
  if (req.user.role !== 'patient') {
    return next(HttpError.forbidden('This area is for patients only.'));
  }
  return next();
}

export function requireDoctor(req, _res, next) {
  if (!req.user) return next(HttpError.unauthorized('Please sign in to continue.'));
  if (req.user.role !== 'doctor') {
    return next(HttpError.forbidden('This area is for doctors only.'));
  }
  return next();
}
