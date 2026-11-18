import { z } from 'zod';

/*
 * bcrypt only uses the first 72 bytes of a password, so anything longer is
 * truncated silently. Rejecting it is clearer than pretending it counted.
 */
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, 'Use at least 8 characters.')
  .max(PASSWORD_MAX, 'Password must be 72 characters or fewer.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.'))
  .pipe(z.string().max(254, 'Email is too long.'));

const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone number is too long.')
  .refine(
    (value) => value === '' || /^[+]?[\d\s().-]{7,30}$/.test(value),
    'Enter a valid phone number.',
  )
  .optional();

/*
 * Registration accepts exactly the fields a patient may set. Role is never read
 * from the body — every public registration becomes a patient.
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(80, 'Full name is too long.'),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(PASSWORD_MAX),
});
