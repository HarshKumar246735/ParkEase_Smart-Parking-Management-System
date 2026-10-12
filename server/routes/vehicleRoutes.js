import { Router } from 'express';
import { listVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateId } from '../middleware/validateObjectId.js';

const router = Router();
router.use(protect);
router.get('/', listVehicles);
router.post('/', createVehicle);
router.get('/:id', validateId('id'), getVehicle);
router.put('/:id', validateId('id'), updateVehicle);
router.delete('/:id', validateId('id'), deleteVehicle);
export default router;
