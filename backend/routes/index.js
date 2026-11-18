import { Router } from 'express';
import authRoutes from './authRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { databaseStatus } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();

/**
 * Liveness/readiness probe. Reports the real database state, so it fails with
 * 503 while the database is unavailable instead of pretending everything is fine.
 */
router.get('/health', (_req, res) => {
  const database = databaseStatus();
  const healthy = database.state === 'connected';

  return sendSuccess(
    res,
    {
      status: healthy ? 'ok' : 'degraded',
      service: 'opencare-api',
      environment: env.nodeEnv,
      database,
      clinicTimezone: env.clinicTimezone,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    healthy ? 200 : 503,
  );
});

router.use('/auth', authRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);

export default router;
