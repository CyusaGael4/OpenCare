import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const backendRoot = path.resolve(currentDir, '..');
const envFile = path.join(backendRoot, '.env');

/*
 * The .env file is the single source of truth for local configuration and is
 * intentionally never rewritten by the application. We only read it.
 */
if (!fs.existsSync(envFile)) {
  console.error(
    [
      '',
      'OpenCare API could not start: backend/.env is missing.',
      '',
      'Create it from the template:',
      '  cp backend/.env.example backend/.env',
      'then fill in MONGODB_URI (and SESSION_SECRET before deploy).',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

dotenv.config({ path: envFile });

const booleanString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

/**
 * Blank values in a shared shell are ambient noise, not configuration, so they
 * are treated as "unset" and allowed to fall through to their defaults.
 */
const treatBlankAsUnset = (schema) =>
  z.preprocess((value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }, schema);

/*
 * PORT=0 would make the OS pick a random port, which breaks the Vite dev proxy
 * and every documented URL, so it is treated as unset rather than honoured.
 * Some shells/tooling export PORT=0 by default.
 */
const portSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '0') return undefined;
  return trimmed;
}, z.coerce.number().int().min(1).max(65535).default(4000));

const envSchema = z.object({
  NODE_ENV: treatBlankAsUnset(z.enum(['development', 'test', 'production']).default('development')),
  PORT: portSchema,

  // Browser origin(s) allowed to send credentialed requests.
  CLIENT_ORIGIN: treatBlankAsUnset(z.url().default('http://localhost:5173')),
  CLIENT_ORIGINS: treatBlankAsUnset(z.string().optional()),

  MONGODB_URI: treatBlankAsUnset(
    z
      .string()
      .min(1, 'MONGODB_URI is empty')
      .refine(
        (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
        'MONGODB_URI must start with mongodb:// or mongodb+srv://',
      ),
  ),
  // Atlas URIs pasted from the dashboard often omit the database name,
  // so the app supplies one explicitly instead of depending on the URI.
  MONGODB_DB_NAME: treatBlankAsUnset(z.string().min(1).default('opencare')),

  SESSION_SECRET: treatBlankAsUnset(
    z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  ),
  SESSION_MAX_AGE_MS: treatBlankAsUnset(
    z.coerce.number().int().positive().default(86_400_000),
  ),
  SESSION_COOKIE_SECURE: treatBlankAsUnset(booleanString.optional()),

  // Kigali/Rwanda: UTC+2 all year, no daylight saving transitions.
  CLINIC_TIMEZONE: treatBlankAsUnset(z.string().min(1).default('Africa/Kigali')),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues.map(
    (issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`,
  );
  console.error(['', 'OpenCare API could not start: invalid environment.', ...problems, ''].join('\n'));
  process.exit(1);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === 'production';
const isTest = raw.NODE_ENV === 'test';

/* Sessions are configured in Milestone 2; the secret is validated here so a
 * misconfigured deployment fails at boot rather than at first login. */
let sessionSecret = raw.SESSION_SECRET;
let generatedSessionSecret = false;

if (!sessionSecret) {
  if (isProduction) {
    console.error(
      [
        '',
        'OpenCare API could not start: SESSION_SECRET is required in production.',
        'Generate one with:',
        "  node -e \"console.log(require('node:crypto').randomBytes(48).toString('hex'))\"",
        '',
      ].join('\n'),
    );
    process.exit(1);
  }
  // Development convenience: a per-process secret keeps the app runnable
  // without ever writing a secret into a file. Sessions do not survive restart.
  sessionSecret = crypto.randomBytes(48).toString('hex');
  generatedSessionSecret = true;
}

const allowedOrigins = Array.from(
  new Set(
    [raw.CLIENT_ORIGIN, ...(raw.CLIENT_ORIGINS ?? '').split(',')]
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  ),
);

export const env = Object.freeze({
  nodeEnv: raw.NODE_ENV,
  isProduction,
  isTest,
  isDevelopment: !isProduction && !isTest,
  port: raw.PORT,
  allowedOrigins,
  mongoUri: raw.MONGODB_URI,
  mongoDbName: raw.MONGODB_DB_NAME,
  sessionSecret,
  generatedSessionSecret,
  sessionMaxAgeMs: raw.SESSION_MAX_AGE_MS,
  sessionCookieSecure: raw.SESSION_COOKIE_SECURE ?? isProduction,
  clinicTimezone: raw.CLINIC_TIMEZONE,
});
