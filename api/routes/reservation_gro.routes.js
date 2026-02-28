import express from 'express';
import reservationController from '../controllers/reservation.controller.js';

import {
  getOpenBills,
  getOpenBillById,
  addItemToOpenBill,
  removeItemFromOpenBill,
  closeOpenBill,
  cancelOpenBill,
  addCustomAmountToOpenBill,
  updateCustomAmountInOpenBill,
  removeCustomAmountFromOpenBill,
  getCustomAmountFromOpenBill

} from '../controllers/openBill.controller.js';

const router = express.Router();

// ✅ Open bills nested under reservations-gro
router.route('/open-bills')
  .get(getOpenBills);

router.route('/open-bills/:id')
  .get(getOpenBillById);

router.route('/open-bills/:id/items')
  .post(addItemToOpenBill);

router.route('/open-bills/:id/items/:itemId')
  .delete(removeItemFromOpenBill);

router.route('/open-bills/:id/close')
  .post(closeOpenBill);

router.route('/open-bills/:id/cancel')
  .post(cancelOpenBill);

router.post('/open-bills/:id/custom-amount', addCustomAmountToOpenBill);
router.put('/open-bills/:id/custom-amount/:customAmountId', updateCustomAmountInOpenBill);
router.delete('/open-bills/:id/custom-amount/:customAmountId', removeCustomAmountFromOpenBill);
router.get('/open-bills/:id/custom-amount/:customAmountId', getCustomAmountFromOpenBill);

// Reservation routes
router.post('/', reservationController.createReservation);
router.post('/with-order', reservationController.createReservationWithOrder);
router.get('/', reservationController.getReservations);
router.get('/availability', reservationController.checkAvailability);
router.get('/:id', reservationController.getReservationById);
router.patch('/:id/status', reservationController.updateReservationStatus);
router.post('/:id/cancel', reservationController.cancelReservation);



export default router;