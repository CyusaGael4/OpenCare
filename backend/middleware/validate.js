import { HttpError } from '../utils/HttpError.js';

/** Shape Zod issues into the field/message pairs the forms render. */
export function formatIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path?.length ? issue.path.join('.') : 'form',
    message: issue.message,
  }));
}

/**
 * Validates req.body against a Zod schema.
 *
 * The parsed value replaces req.body so handlers only ever see normalised,
 * trusted data (trimmed, lowercased, stripped of unknown keys).
 */
export function validateBody(schema) {
  return function validate(req, _res, next) {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(
        HttpError.badRequest('Please check the highlighted fields.', formatIssues(result.error.issues)),
      );
    }
    req.body = result.data;
    return next();
  };
}

/** Query-string variant, for list filters and pagination. */
export function validateQuery(schema) {
  return function validate(req, _res, next) {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) {
      return next(
        HttpError.badRequest('Invalid query parameters.', formatIssues(result.error.issues)),
      );
    }
    req.validatedQuery = result.data;
    return next();
  };
}
