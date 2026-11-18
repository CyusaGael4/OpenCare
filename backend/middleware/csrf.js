import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Ensure the session carries a CSRF token.
 *
 * The token lives server-side in the session and is read by the client through
 * GET /api/auth/me. It is deliberately readable by our own JavaScript — it is
 * not a credential by itself, it just proves the request came from a page that
 * could read our origin's response, which a cross-site form cannot.
 */
export function ensureCsrfToken(req, _res, next) {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
}

export function getCsrfToken(req) {
  return req.session?.csrfToken ?? null;
}

/** Constant-time comparison that tolerates differing lengths. */
function tokensMatch(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Reject state-changing requests without the session's CSRF token.
 *
 * SameSite=lax already blocks most cross-site form posts, but it is browser
 * behaviour, not an authorization decision, so it is treated as defence in
 * depth rather than the whole control.
 */
export function requireCsrf(req, _res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  // A browser always sends Origin on cross-origin mutations; if present it must
  // match an allowed origin.
  const origin = req.get('origin');
  if (origin) {
    const normalised = origin.replace(/\/$/, '');
    if (!env.allowedOrigins.includes(normalised)) {
      return next(
        HttpError.forbidden('This request came from an origin OpenCare does not serve.', {
          code: 'ORIGIN_NOT_ALLOWED',
        }),
      );
    }
  }

  if (!tokensMatch(req.get('x-csrf-token'), getCsrfToken(req))) {
    return next(
      HttpError.forbidden(
        'Your security token is missing or expired. Refresh the page and try again.',
        { code: 'CSRF_INVALID' },
      ),
    );
  }

  return next();
}
