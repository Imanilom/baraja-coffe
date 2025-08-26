// controllers/favoriteController.js
import User from '../models/user.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

/**
 * Tambahkan menu ke favorit user
 */
export const addFavorite = async (req, res) => {
    try {
        const { userId, menuItemId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });

        // Tambah ke favorit kalau belum ada
        if (!user.favorites.includes(menuItemId)) {
            user.favorites.push(menuItemId);
            await user.save();
        }

        return res.json({ success: true, favorites: user.favorites });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Hapus menu dari favorit user
 */
export const removeFavorite = async (req, res) => {
    try {
        const { userId, menuItemId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.favorites = user.favorites.filter(id => id.toString() !== menuItemId);
        await user.save();

        return res.json({ success: true, favorites: user.favorites });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Ambil semua menu favorit user
 */
export const getFavorites = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('favorites');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.json({ success: true, favorites: user.favorites });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
