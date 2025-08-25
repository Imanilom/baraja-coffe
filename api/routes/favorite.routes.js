// routes/favoriteRoutes.js
import express from 'express';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/favorite.controller.js';

const router = express.Router();

// Tambah ke favorit
router.post('/:userId/:menuItemId', addFavorite);

// Hapus dari favorit
router.delete('/:userId/:menuItemId', removeFavorite);

// Ambil semua favorit
router.get('/:userId', getFavorites);

export default router;
