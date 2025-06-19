// routes/areas.js
import express from 'express';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';

const router = express.Router();

// GET /api/areas - Get all areas with tables
router.get('/', async (req, res) => {
    try {
        const areas = await Area.find({ is_active: true })
            .populate({
                path: 'tables',
                match: { is_active: true },
                select: 'table_number seats table_type is_available'
            })
            .sort({ area_code: 1 });

        const formattedAreas = areas.map(area => ({
            id: area._id.toString(),
            area_code: area.area_code,
            area_name: area.area_name,
            capacity: area.capacity,
            description: area.description,
            is_active: area.is_active,
            tables: area.tables.map(table => ({
                id: table._id.toString(),
                table_number: table.table_number,
                seats: table.seats,
                table_type: table.table_type,
                is_available: table.is_available
            })),
            total_tables: area.tables.length,
            available_tables: area.tables.filter(t => t.is_available).length,
            created_at: area.created_at,
            updated_at: area.updated_at
        }));

        res.status(200).json({
            success: true,
            message: 'Areas retrieved successfully',
            data: formattedAreas
        });
    } catch (error) {
        console.error('Error getting areas:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve areas',
            error: error.message
        });
    }
});

// GET /api/areas/:areaId/tables - Get tables for specific area
router.get('/:areaId/tables', async (req, res) => {
    try {
        const { areaId } = req.params;

        const area = await Area.findById(areaId);
        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        const tables = await Table.find({
            area_id: areaId,
            is_active: true
        }).sort({ table_number: 1 });

        res.status(200).json({
            success: true,
            message: 'Tables retrieved successfully',
            data: {
                area: {
                    id: area._id.toString(),
                    area_code: area.area_code,
                    area_name: area.area_name,
                    capacity: area.capacity
                },
                tables: tables.map(table => ({
                    id: table._id.toString(),
                    table_number: table.table_number,
                    seats: table.seats,
                    table_type: table.table_type,
                    is_available: table.is_available
                }))
            }
        });
    } catch (error) {
        console.error('Error getting tables:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tables',
            error: error.message
        });
    }
});

// GET /api/areas/availability - Check area availability
router.get('/availability', async (req, res) => {
    try {
        const { date, time, area_id, guest_count } = req.query;

        if (!date || !time || !area_id || !guest_count) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: date, time, area_id, guest_count'
            });
        }

        // Get area with tables
        const area = await Area.findById(area_id).populate({
            path: 'tables',
            match: { is_active: true }
        });

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        // Check if guest count exceeds area capacity
        if (parseInt(guest_count) > area.capacity) {
            return res.status(200).json({
                success: true,
                available: false,
                message: `Guest count exceeds area capacity (${area.capacity})`,
                reason: 'capacity_exceeded'
            });
        }

        // For now, we'll consider area available if it has active tables
        // You can extend this logic to check actual reservations
        const availableTables = area.tables.filter(table => table.is_available);
        const hasAvailableTables = availableTables.length > 0;

        // Calculate required tables based on guest count and average seats per table
        const avgSeatsPerTable = area.tables.reduce((sum, table) => sum + table.seats, 0) / area.tables.length || 4;
        const requiredTables = Math.ceil(parseInt(guest_count) / avgSeatsPerTable);
        const enoughTables = availableTables.length >= requiredTables;

        res.status(200).json({
            success: true,
            available: hasAvailableTables && enoughTables,
            message: hasAvailableTables && enoughTables
                ? 'Area is available for reservation'
                : 'Area is not available for the selected time and guest count',
            data: {
                area_name: area.area_name,
                total_tables: area.tables.length,
                available_tables: availableTables.length,
                required_tables: requiredTables,
                guest_count: parseInt(guest_count),
                capacity: area.capacity
            }
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check availability',
            error: error.message
        });
    }
});

export default router;