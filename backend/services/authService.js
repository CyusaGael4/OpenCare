import bcrypt from 'bcrypt';
import crypto from 'node:crypto';

/* Cost 12 is a deliberate balance: strong against offline cracking, still well
 * under a second on current hardware. */
const BCRYPT_ROUNDS = 12;

/*
 * A valid bcrypt hash of random bytes, used only when an email does not exist.
 * Comparing against it keeps a failed login for an unknown account roughly as
 * slow as one for a real account, so response timing does not reveal which
 * emails are registered.
 */
const DECOY_HASH = '$2b$12$U.qwIrl4PM9k7tQ6O2/gP.cVxneE4jN/M7vuh4R9f7zsFYtEIN3N2';

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

export function verifyPassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash ?? DECOY_HASH);
}

export function verifyDecoyPassword(plainPassword) {
  return bcrypt.compare(plainPassword, DECOY_HASH);
}

/** New CSRF secret for a freshly authenticated session. */
export function newCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}
