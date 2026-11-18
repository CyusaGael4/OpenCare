import rateLimit from 'express-rate-limit';

const minutes = (count) => count * 60 * 1000;

/* Broad protection for the whole API: absorbs scripted scraping and runaway
 * clients without affecting normal browsing. */
export const apiLimiter = rateLimit({
  windowMs: minutes(15),
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
  },
});

/*
 * Strict limiter for credential endpoints, which are the expensive and
 * brute-forceable ones. Successful requests are not counted, so a person
 * signing in normally is never locked out; repeated failures are.
 */
export const authLimiter = rateLimit({
  windowMs: minutes(15),
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many attempts. Please wait 15 minutes before trying again.',
  },
});
