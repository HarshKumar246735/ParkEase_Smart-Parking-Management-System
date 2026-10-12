import { Router } from 'express';
import { getFloors, getZonesForFloor, getSlotsForZone, getSlots, getSlot, getAvailability, getRates } from '../controllers/parkingController.js';
import { active, history, getOne, bill, leave } from '../controllers/parkingSessionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateId, validateQueryIds } from '../middleware/validateObjectId.js';
import { sensitiveLimiter } from '../middleware/rateLimiters.js';

const router = Router();
// public read-only availability (landing page statistics)
router.get('/availability', getAvailability);
router.get('/rates', getRates);
router.get('/floors', getFloors);
router.get('/floors/:id/zones', validateId('id'), getZonesForFloor);
router.get('/zones/:id/slots', validateId('id'), getSlotsForZone);
router.get('/slots', validateQueryIds('floorId', 'zoneId'), getSlots);
router.get('/slots/:id', validateId('id'), getSlot);

// parking sessions (authenticated, owner-scoped)
router.get('/sessions/active', protect, active);
router.get('/sessions/history', protect, history);
router.get('/sessions/:id', protect, validateId('id'), getOne);
router.get('/sessions/:id/bill', protect, validateId('id'), bill);
router.post('/sessions/:id/leave', protect, sensitiveLimiter, validateId('id'), leave);
export default router;
