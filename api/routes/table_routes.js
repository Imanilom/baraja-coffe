// routes/table.routes.js
import express from 'express';
import Table from '../models/Table.model.js';

const router = express.Router();

// Get available tables by area
router.get('/available/:areaId', async (req, res) => {
    try {
        const { areaId } = req.params;

        const availableTables = await Table.find({
            area_id: areaId,
            status: 'available',
            is_available: true,
            is_active: true
        }).populate('area_id', 'name code');

        res.json({
            success: true,
            tables: availableTables
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data meja',
            error: error.message
        });
    }
});

// Check specific table availability
router.get('/check/:tableNumber', async (req, res) => {
    try {
        const { tableNumber } = req.params;

        const table = await Table.findOne({
            table_number: tableNumber.toUpperCase(),
            is_active: true
        }).populate('area_id', 'name code');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Meja tidak ditemukan'
            });
        }

        const isAvailable = table.status === 'available' && table.is_available;

        res.json({
            success: true,
            table: table,
            isAvailable: isAvailable,
            message: isAvailable ? 'Meja tersedia' : `Meja sedang tidak tersedia`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengecek ketersediaan meja',
            error: error.message
        });
    }
});

export default router;