import { Router } from 'express';
import { create, mine, getOne, cancel, arrive } from '../controllers/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateId } from '../middleware/validateObjectId.js';
import { sensitiveLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.use(protect);
router.post('/', sensitiveLimiter, create);
router.get('/my', mine);
router.get('/:id', validateId('id'), getOne);
router.delete('/:id', sensitiveLimiter, validateId('id'), cancel);
router.post('/:id/check-in', sensitiveLimiter, validateId('id'), arrive);
export default router;
