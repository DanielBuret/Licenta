// backend/src/routes/admin/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { adminStationsRouter } from './stations.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.use('/stations', adminStationsRouter);
