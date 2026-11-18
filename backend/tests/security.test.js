import test from 'node:test';
import assert from 'node:assert/strict';

import { requireAuth, requireDoctor, requirePatient } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { formatIssues, validateBody } from '../middleware/validate.js';
import { HttpError } from '../utils/HttpError.js';
import { loginSchema, passwordSchema, registerSchema } from '../validators/authSchemas.js';

test('password schema blocks weak credentials and enforces the configured length limits', () => {
  assert.equal(passwordSchema.safeParse('Password1').success, true);
  assert.equal(passwordSchema.safeParse('pass').success, false);
  assert.equal(passwordSchema.safeParse('password').success, false);
  assert.equal(passwordSchema.safeParse('Password').success, false);
  assert.equal(passwordSchema.safeParse('P'.repeat(73)).success, false);
});

test('auth validation normalises form input and preserves field-level errors', () => {
  const req = {
    body: {
      fullName: '  jane doe  ',
      email: '  JANE@EXAMPLE.COM  ',
      password: 'Password123',
    },
  };

  let nextError = null;
  const next = (error) => {
    nextError = error;
  };

  validateBody(registerSchema)(req, {}, next);

  assert.equal(nextError, undefined);
  assert.equal(req.body.fullName, 'jane doe');
  assert.equal(req.body.email, 'jane@example.com');
  assert.equal(req.body.password, 'Password123');

  const invalid = validateBody(loginSchema)({ body: { email: 'bad', password: '' } }, {}, () => {});
  assert.equal(invalid, undefined);

  let issues = null;
  validateBody(loginSchema)({ body: { email: 'bad', password: '' } }, {}, (error) => {
    issues = error.details;
  });
  assert.ok(Array.isArray(issues));
  assert.deepEqual(
    issues.map((issue) => issue.field),
    ['email', 'password'],
  );
  assert.equal(formatIssues([{ path: ['email'], message: 'Bad email' }])[0].field, 'email');
});

test('CSRF middleware rejects missing tokens and foreign origins', () => {
  const trustedReq = {
    method: 'POST',
    get(headerName) {
      if (headerName === 'origin') return 'http://localhost:5173';
      if (headerName === 'x-csrf-token') return 'correct-token';
      return undefined;
    },
    session: { csrfToken: 'correct-token' },
  };

  let trustedError = null;
  requireCsrf(trustedReq, {}, (error) => {
    trustedError = error;
  });
  assert.equal(trustedError, undefined);

  const untrustedReq = {
    method: 'POST',
    get(headerName) {
      if (headerName === 'origin') return 'https://evil.example';
      if (headerName === 'x-csrf-token') return 'correct-token';
      return undefined;
    },
    session: { csrfToken: 'correct-token' },
  };

  let untrustedError = null;
  requireCsrf(untrustedReq, {}, (error) => {
    untrustedError = error;
  });
  assert.ok(untrustedError instanceof HttpError);
  assert.equal(untrustedError.status, 403);

  const missingTokenReq = {
    method: 'POST',
    get(headerName) {
      if (headerName === 'origin') return 'http://localhost:5173';
      if (headerName === 'x-csrf-token') return undefined;
      return undefined;
    },
    session: { csrfToken: 'correct-token' },
  };

  let missingTokenError = null;
  requireCsrf(missingTokenReq, {}, (error) => {
    missingTokenError = error;
  });
  assert.ok(missingTokenError instanceof HttpError);
  assert.equal(missingTokenError.status, 403);
});

test('auth guards enforce authentication and role checks', () => {
  let nextError = null;
  requireAuth({ user: null }, {}, (error) => {
    nextError = error;
  });
  assert.ok(nextError instanceof HttpError);
  assert.equal(nextError.status, 401);

  let patientError = null;
  requirePatient({ user: { role: 'doctor' } }, {}, (error) => {
    patientError = error;
  });
  assert.ok(patientError instanceof HttpError);
  assert.equal(patientError.status, 403);

  let doctorError = null;
  requireDoctor({ user: { role: 'patient' } }, {}, (error) => {
    doctorError = error;
  });
  assert.ok(doctorError instanceof HttpError);
  assert.equal(doctorError.status, 403);

  assert.equal(typeof requireAuth({ user: { role: 'patient' } }, {}, () => {}), 'undefined');
});
