import { Router } from 'express';
import { register, login, me, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
export default router;
