// backend/src/routes/admin/index.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';
import { adminStationsRouter } from './stations.js';
import { adminUsersRouter } from './users.js';
import { adminReservationsRouter } from './reservations.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.use('/stations', adminStationsRouter);
adminRouter.use('/users', adminUsersRouter);
adminRouter.use('/reservations', adminReservationsRouter);
