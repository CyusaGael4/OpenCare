/**
 * Express 4 does not catch rejected promises from async handlers. Wrapping them
 * here means every failure reaches the single error handler instead of becoming
 * an unhandled rejection that hangs the request.
 */
export function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export default asyncHandler;
