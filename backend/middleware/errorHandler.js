import { logger } from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';
import { HttpError } from '../utils/HttpError.js';
import { env } from '../config/env.js';

/** Any request that reached the router but matched nothing. */
export function notFoundHandler(req, _res, next) {
  next(HttpError.notFound(`No API route matches ${req.method} ${req.originalUrl}.`));
}

/**
 * Single place where errors become HTTP responses, so controllers can simply
 * throw and stay readable. Known error shapes are translated; unknown ones are
 * logged with a stack and reported as an opaque 500 in production.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity.
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error instanceof HttpError ? error.status : 500;
  let message = error instanceof HttpError ? error.message : 'Something went wrong on our side.';
  let details = error instanceof HttpError ? error.details : undefined;

  // Malformed JSON body from express.json()
  if (error?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  }

  // Mongoose schema validation
  if (error?.name === 'ValidationError' && error.errors) {
    status = 400;
    message = 'Some fields are invalid.';
    details = Object.entries(error.errors).map(([field, issue]) => ({
      field,
      message: issue.message,
    }));
  }

  // Bad ObjectId cast in a route param or query
  if (error?.name === 'CastError') {
    status = 400;
    message = `Invalid value for "${error.path}".`;
  }

  // Unique index violation (also how double-booking is rejected)
  if (error?.code === 11000) {
    status = 409;
    message = 'That record already exists.';
    details = error.keyValue ? { fields: Object.keys(error.keyValue) } : undefined;
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} → ${status}: ${error?.message ?? error}`);
    if (error?.stack) logger.debug(error.stack);
  } else {
    logger.debug(`${req.method} ${req.originalUrl} → ${status}: ${message}`);
  }

  const payload =
    status >= 500 && env.isProduction ? 'Something went wrong on our side.' : message;

  return sendError(res, payload, status, details);
}
