import express from 'express';
import { MenuRatingController } from '../controllers/menuRating.controller.js';
// import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { validateRating } from '../utils/middleware/validateRating.js';

const router = express.Router();

// === PUBLIC ROUTES (tidak perlu login) ===

// Mendapatkan rating untuk menu tertentu
router.get('/menu/:menuItemId', MenuRatingController.getMenuRatings);

// Mendapatkan summary rating untuk menu
router.get('/menu/:menuItemId/summary', MenuRatingController.getMenuRatingSummary);

// Mendapatkan top rated menus
router.get('/top-rated', MenuRatingController.getTopRatedMenus);

// Mark rating as helpful (bisa anonymous)
router.patch('/:ratingId/helpful', MenuRatingController.markHelpful);

// === CUSTOMER ROUTES (perlu login) ===
// router.use(authMiddleware); // Semua route dibawah ini perlu authentication

// Membuat rating baru
router.post('/', validateRating, MenuRatingController.createRating);

// Mendapatkan rating customer untuk menu dan order tertentu
router.get('/my-rating/:menuItemId/:orderId', MenuRatingController.getCustomerRating);

// Update rating customer
router.put('/:ratingId', validateRating, MenuRatingController.updateRating);

// Delete rating customer
router.delete('/:ratingId', MenuRatingController.deleteRating);

// === ADMIN ROUTES (perlu login + admin role) ===
// router.use(adminMiddleware); // Semua route dibawah ini perlu admin access

// Moderate rating (approve/reject)
router.patch('/:ratingId/moderate', MenuRatingController.moderateRating);

// Mendapatkan rating yang perlu moderasi
router.get('/admin/pending', MenuRatingController.getPendingRatings);

export default router;