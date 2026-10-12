import { Router } from 'express';
import { userDashboard, adminDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/user', protect, userDashboard);
router.get('/admin', protect, adminOnly, adminDashboard);
export default router;
