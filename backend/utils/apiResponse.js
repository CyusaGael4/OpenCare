/*
 * Every API response uses the same envelope so the client never has to guess:
 *   success -> { success: true,  data: ... }
 *   failure -> { success: false, message, details? }
 */
export function sendSuccess(res, data = null, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function sendError(res, message, status = 400, details) {
  const body = { success: false, message };
  if (details !== undefined) body.details = details;
  return res.status(status).json(body);
}
