/*
 * Error type for expected, client-facing failures. Anything else thrown is
 * treated as an unexpected 500 and its message is hidden in production.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, HttpError);
  }

  static badRequest(message = 'Invalid request.', details) {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'You need to sign in to continue.') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'You do not have access to this resource.') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Resource not found.') {
    return new HttpError(404, message);
  }

  static conflict(message = 'That request conflicts with the current state.', details) {
    return new HttpError(409, message, details);
  }
}
