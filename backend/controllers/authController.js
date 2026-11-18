import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/HttpError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getCsrfToken } from '../middleware/csrf.js';
import { destroySession } from '../middleware/auth.js';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.js';
import {
  hashPassword,
  newCsrfToken,
  verifyDecoyPassword,
  verifyPassword,
} from '../services/authService.js';

/* Auth responses are personalised, so they must never be cached by a browser,
 * shared proxy or CDN. */
function noStore(res) {
  res.set('Cache-Control', 'no-store');
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

/**
 * Bind an authenticated user to a brand-new session.
 *
 * Regenerating first prevents session fixation: any identifier an attacker
 * managed to plant before login is discarded, and the CSRF token is rotated
 * with it because a privilege level just changed.
 */
async function establishSession(req, user) {
  await regenerateSession(req);
  req.session.userId = user._id.toString();
  // Stored for convenience and logging only. Authorisation always re-reads the
  // account from the database, so a stale role can never grant access.
  req.session.role = user.role;
  req.session.csrfToken = newCsrfToken();
  await saveSession(req);
}

/** POST /api/auth/register — public signup, always creates a patient. */
export const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) {
    throw HttpError.conflict('An account with this email already exists. Try signing in instead.');
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    fullName,
    email,
    phone: phone ? phone : null,
    passwordHash,
    role: 'patient', // never taken from the request body
  });

  await establishSession(req, user);

  noStore(res);
  return sendSuccess(res, { user: user.toPublicJSON(), csrfToken: getCsrfToken(req) }, 201);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmailWithPassword(email);

  // Always spend the bcrypt cost, whether or not the account exists.
  const passwordMatches = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyDecoyPassword(password);

  if (!user || !passwordMatches) {
    throw HttpError.unauthorized('Email or password is incorrect.');
  }

  if (!user.isActive) {
    throw HttpError.forbidden('This account is inactive. Please contact the clinic.');
  }

  await establishSession(req, user);

  noStore(res);
  return sendSuccess(res, { user: user.toPublicJSON(), csrfToken: getCsrfToken(req) });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (req, res) => {
  await destroySession(req);
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());

  noStore(res);
  return sendSuccess(res, { message: 'You have been signed out.' });
});

/**
 * GET /api/auth/me
 *
 * The client calls this on every page load to restore the session after a
 * refresh, and it is also where a signed-out visitor gets a CSRF token before
 * signing in.
 */
export const me = asyncHandler(async (req, res) => {
  noStore(res);
  return sendSuccess(res, {
    user: req.user ? req.user.toPublicJSON() : null,
    csrfToken: getCsrfToken(req),
  });
});
