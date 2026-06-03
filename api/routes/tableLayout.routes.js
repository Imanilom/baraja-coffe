// import express from 'express';
// import {
//   createTableLayout,
//   getTableLayoutByOutlet,
//   updateTableLayout,
//   deleteTableLayout,
//   getTableStatusByOutlet,
//   getAvailableTablesByPeople,
//   updateTableStatus
// } from '../controllers/tableLayout.controller.js';

// import { verifyToken } from '../utils/verifyUser.js';

// const router = express.Router();

// const waitersAccess = verifyToken(['staff', 'waiter', 'admin', 'superadmin']);
// // POST /api/table-layout
// router.post('/', waitersAccess, createTableLayout);

// // GET /api/table-layout/:outletId
// router.get('/:outletId', getTableLayoutByOutlet);

// // PUT /api/table-layout/:outletId
// router.put('/:outletId', waitersAccess, updateTableLayout);

// // DELETE /api/table-layout/:outletId
// router.delete('/:outletId', waitersAccess, deleteTableLayout);

// // Ambil status meja berdasarkan outlet
// router.get('/table-status/:outletId', getTableStatusByOutlet);

// // Ambil status meja berdasarkan outlet
// router.get('/available-bypeople/:outletId', getAvailableTablesByPeople);

// // Update status meja
// router.put('/update-status/:outletId', waitersAccess, updateTableStatus);

// export default router;