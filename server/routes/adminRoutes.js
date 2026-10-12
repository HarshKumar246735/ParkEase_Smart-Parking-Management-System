import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { validateId, validateQueryIds } from '../middleware/validateObjectId.js';
import * as p from '../controllers/adminParkingController.js';
import * as a from '../controllers/adminController.js';

const router = Router();
router.use(protect, adminOnly);

router.get('/floors', p.adminFloors);
router.post('/floors', p.createFloor);
router.put('/floors/:id', validateId('id'), p.updateFloor);

router.get('/zones', validateQueryIds('floorId'), p.adminZones);
router.post('/zones', p.createZone);
router.put('/zones/:id', validateId('id'), p.updateZone);

router.get('/slots', validateQueryIds('floorId', 'zoneId'), p.adminSlots);
router.post('/slots', p.createSlots);
router.put('/slots/:id', validateId('id'), p.updateSlot);
router.post('/slots/:id/maintenance', validateId('id'), p.setMaintenance);
router.post('/slots/:id/restore', validateId('id'), p.restoreSlot);

router.get('/rates', a.getRates);
router.put('/rates/:vehicleType', a.updateRate);
router.put('/settings', a.updateSettings);

router.get('/reservations', a.listReservations);
router.get('/sessions', a.listSessions);
router.get('/payments', a.listPayments);
router.get('/users', a.listUsers);
router.get('/users/:id', validateId('id'), a.getUserDetail);
router.get('/reports', a.reports);
export default router;
