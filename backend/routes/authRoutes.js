import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimits.js';
import { loginSchema, registerSchema } from '../validators/authSchemas.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', me);

export default router;
