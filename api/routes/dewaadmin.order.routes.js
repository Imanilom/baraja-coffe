import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import * as dewaadminController from '../controllers/dewaadmin.order.controller.js';

const router = express.Router();

// Middleware: Hanya role "dewaadmin" yang diizinkan mengakses rute-rute di bawah ini
const dewaAdminAccess = verifyToken(['dewaadmin']);

router.post('/', dewaAdminAccess, dewaadminController.createOrder);
router.get('/', dewaAdminAccess, dewaadminController.getAllOrders);
router.get('/:id', dewaAdminAccess, dewaadminController.getOrderById);
router.put('/:id', dewaAdminAccess, dewaadminController.updateOrder);
router.delete('/:id', dewaAdminAccess, dewaadminController.deleteOrder);

export default router;
