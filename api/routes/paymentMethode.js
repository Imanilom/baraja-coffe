import express from 'express';
import {
  createPaymentMethod,
  getAllPaymentMethods,
  getPaymentMethodById,
  updatePaymentMethod,
  deletePaymentMethod,
  getPaymentMethodsAndTypes,
  getPaymentMethodsLegacy
} from '../controllers/paymentMethod.controller.js';

const router = express.Router();

// Backward compatible endpoints for POS and App
router.get('/payment-methods-and-types', getPaymentMethodsAndTypes);
router.get('/payment-methods', getPaymentMethodsLegacy);

// Standard CRUD endpoints for backoffice
router.post('/', createPaymentMethod);
router.get('/', getAllPaymentMethods);
router.get('/:id', getPaymentMethodById);
router.put('/:id', updatePaymentMethod);
router.delete('/:id', deletePaymentMethod);

export default router;
