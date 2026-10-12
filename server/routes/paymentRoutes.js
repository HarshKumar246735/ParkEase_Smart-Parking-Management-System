import { Router } from 'express';
import { options, createDemo, history, getOne, receipt } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateId } from '../middleware/validateObjectId.js';
import { sensitiveLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.use(protect);
router.get('/options', options);
router.post('/demo', sensitiveLimiter, createDemo);
router.get('/history', history);
router.get('/:id', validateId('id'), getOne);
router.get('/:id/receipt', validateId('id'), receipt);
export default router;
