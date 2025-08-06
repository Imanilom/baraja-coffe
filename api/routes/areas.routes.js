// routes/area.routes.js
import express from 'express';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import Reservation from '../models/Reservation.model.js';

const router = express.Router();

// AREA CRUD OPERATIONS //

// Create a new area
router.post('/', async (req, res) => {
    try {
        const { area_code, area_name, capacity, description } = req.body;

        // Check if area code already exists
        const existingArea = await Area.findOne({ area_code });
        if (existingArea) {
            return res.status(400).json({
                success: false,
                message: 'Area code already exists'
            });
        }

        const newArea = new Area({
            area_code: area_code.toUpperCase(),
            area_name,
            capacity,
            description: description || ''
        });

        const savedArea = await newArea.save();
        
        res.status(201).json({
            success: true,
            message: 'Area created successfully',
            data: savedArea
        });
    } catch (error) {
        console.error('Error creating area:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating area',
            error: error.message
        });
    }
});

// Get all areas
router.get('/', async (req, res) => {
    try {
        const { date, time } = req.query;
        const areas = await Area.find({ is_active: true }).sort({ area_code: 1 });

        if (date && time) {
            const areasWithAvailability = await Promise.all(
                areas.map(async (area) => {
                    const tables = await Table.find({ area_id: area._id, is_active: true });
                    const reservationDate = new Date(date);

                    const existingReservations = await Reservation.find({
                        reservation_date: {
                            $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                            $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
                        },
                        reservation_time: time,
                        area_id: area._id,
                        status: { $in: ['confirmed', 'pending'] }
                    });

                    const reservedTableIds = [];
                    existingReservations.forEach(reservation => {
                        reservation.table_id.forEach(tableId => {
                            if (!reservedTableIds.includes(tableId.toString())) {
                                reservedTableIds.push(tableId.toString());
                            }
                        });
                    });

                    const availableTables = tables.filter(table =>
                        !reservedTableIds.includes(table._id.toString())
                    );

                    const totalReservedGuests = existingReservations.reduce((sum, reservation) => {
                        return sum + reservation.guest_count;
                    }, 0);

                    const availableCapacity = area.capacity - totalReservedGuests;

                    return {
                        ...area.toObject(),
                        totalTables: tables.length,
                        availableTables: availableTables.length,
                        reservedTables: tables.length - availableTables.length,
                        availableCapacity: Math.max(0, availableCapacity),
                        totalReservedGuests,
                        isFullyBooked: availableTables.length === 0 || availableCapacity <= 0,
                        tables: tables.map(table => ({
                            ...table.toObject(),
                            is_available_for_time: !reservedTableIds.includes(table._id.toString()),
                            is_reserved: reservedTableIds.includes(table._id.toString())
                        }))
                    };
                })
            );

            return res.json({ success: true, data: areasWithAvailability });
        }

        const areasWithTables = await Promise.all(
            areas.map(async (area) => {
                const tables = await Table.find({ area_id: area._id, is_active: true });
                return {
                    ...area.toObject(),
                    totalTables: tables.length,
                    availableTables: tables.filter(t => t.status === 'available').length,
                    reservedTables: tables.filter(t => t.status === 'reserved' || t.status === 'occupied').length,
                    availableCapacity: area.capacity,
                    totalReservedGuests: 0,
                    isFullyBooked: false,
                    tables: tables.map(table => ({
                        ...table.toObject(),
                        is_available_for_time: table.status === 'available',
                        is_reserved: table.status === 'reserved' || table.status === 'occupied'
                    }))
                };
            })
        );

        res.json({ success: true, data: areasWithTables });
    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching areas',
            error: error.message
        });
    }
});

// Get single area by ID
router.get('/:id', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area || !area.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        const tables = await Table.find({ area_id: area._id, is_active: true });
        const areaWithTables = {
            ...area.toObject(),
            tables: tables
        };

        res.json({
            success: true,
            data: areaWithTables
        });
    } catch (error) {
        console.error('Error fetching area:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching area',
            error: error.message
        });
    }
});

// Update an area
router.put('/:id', async (req, res) => {
    try {
        const { area_code, area_name, capacity, description, is_active } = req.body;
        
        // Check if area code is being changed to one that already exists
        if (area_code) {
            const existingArea = await Area.findOne({ 
                area_code: area_code.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (existingArea) {
                return res.status(400).json({
                    success: false,
                    message: 'Area code already exists'
                });
            }
        }

        const updatedArea = await Area.findByIdAndUpdate(
            req.params.id,
            {
                area_code: area_code ? area_code.toUpperCase() : undefined,
                area_name,
                capacity,
                description,
                is_active
            },
            { new: true, runValidators: true }
        );

        if (!updatedArea) {
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        res.json({
            success: true,
            message: 'Area updated successfully',
            data: updatedArea
        });
    } catch (error) {
        console.error('Error updating area:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating area',
            error: error.message
        });
    }
});

// Delete (deactivate) an area
router.delete('/:id', async (req, res) => {
    try {
        // Soft delete by setting is_active to false
        const area = await Area.findByIdAndUpdate(
            req.params.id,
            { is_active: false },
            { new: true }
        );

        if (!area) {
            return res.status(404).json({
                success: false,
                message: 'Area not found'
            });
        }

        // Also deactivate all tables in this area
        await Table.updateMany(
            { area_id: area._id },
            { is_active: false }
        );

        res.json({
            success: true,
            message: 'Area and its tables deactivated successfully',
            data: area
        });
    } catch (error) {
        console.error('Error deactivating area:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating area',
            error: error.message
        });
    }
});

// TABLE CRUD OPERATIONS //

// Create a new table
router.post('/tables', async (req, res) => {
    try {
        const { table_number, area_id, seats, table_type, shape, position } = req.body;

        // Check if area exists and is active
        const area = await Area.findOne({ _id: area_id, is_active: true });
        if (!area) {
            return res.status(400).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        // Check if table number already exists in this area
        const existingTable = await Table.findOne({ 
            table_number: table_number.toUpperCase(), 
            area_id 
        });
        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: 'Table number already exists in this area'
            });
        }

        const newTable = new Table({
            table_number: table_number.toUpperCase(),
            area_id,
            seats: seats || 4,
            table_type: table_type || 'regular',
            shape: shape || 'rectangle',
            position: position || { x: 0, y: 0 }
        });

        const savedTable = await newTable.save();
        
        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: savedTable
        });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating table',
            error: error.message
        });
    }
});

// Get all tables (with optional area filter)
router.get('/tables', async (req, res) => {
    try {
        const { area_id, status } = req.query;
        const query = { is_active: true };

        if (area_id) query.area_id = area_id;
        if (status) query.status = status;

        const tables = await Table.find(query)
            .sort({ table_number: 1 })
            .populate('area_id', 'area_code area_name');

        res.json({
            success: true,
            data: tables
        });
    } catch (error) {
        console.error('Error fetching tables:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tables',
            error: error.message
        });
    }
});

// Get single table by ID
router.get('/tables/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id).populate('area_id', 'area_code area_name');
        if (!table || !table.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Table not found or inactive'
            });
        }

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        console.error('Error fetching table:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching table',
            error: error.message
        });
    }
});

// Update a table
router.put('/tables/:id', async (req, res) => {
    try {
        const { table_number, area_id, seats, table_type, shape, position, status, is_available, is_active } = req.body;

        // Check if table number is being changed to one that already exists in the area
        if (table_number) {
            const existingTable = await Table.findOne({ 
                table_number: table_number.toUpperCase(), 
                area_id: area_id || req.body.area_id,
                _id: { $ne: req.params.id }
            });
            if (existingTable) {
                return res.status(400).json({
                    success: false,
                    message: 'Table number already exists in this area'
                });
            }
        }

        // Check if area exists and is active if area_id is being updated
        if (area_id) {
            const area = await Area.findOne({ _id: area_id, is_active: true });
            if (!area) {
                return res.status(400).json({
                    success: false,
                    message: 'Area not found or inactive'
                });
            }
        }

        const updateData = {
            table_number: table_number ? table_number.toUpperCase() : undefined,
            area_id,
            seats,
            table_type,
            shape,
            position,
            status,
            is_available,
            is_active
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedTable = await Table.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTable) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            message: 'Table updated successfully',
            data: updatedTable
        });
    } catch (error) {
        console.error('Error updating table:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating table',
            error: error.message
        });
    }
});

// Delete (deactivate) a table
router.delete('/tables/:id', async (req, res) => {
    try {
        // Soft delete by setting is_active to false
        const table = await Table.findByIdAndUpdate(
            req.params.id,
            { is_active: false, status: 'maintenance' },
            { new: true }
        );

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        res.json({
            success: true,
            message: 'Table deactivated successfully',
            data: table
        });
    } catch (error) {
        console.error('Error deactivating table:', error);
        res.status(500).json({
            success: false,
            message: 'Error deactivating table',
            error: error.message
        });
    }
});

// Get tables for specific area with availability
router.get('/:id/tables', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time } = req.query;

        const area = await Area.findById(id);
        if (!area || !area.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        const tables = await Table.find({
            area_id: id,
            is_active: true
        }).sort({ table_number: 1 });

        if (date && time) {
            const reservationDate = new Date(date);
            const existingReservations = await Reservation.find({
                reservation_date: {
                    $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
                },
                reservation_time: time,
                area_id: id,
                status: { $in: ['confirmed', 'pending'] }
            });

            const reservedTableIds = [];
            existingReservations.forEach(reservation => {
                reservation.table_id.forEach(tableId => {
                    if (!reservedTableIds.includes(tableId.toString())) {
                        reservedTableIds.push(tableId.toString());
                    }
                });
            });

            const tablesWithAvailability = tables.map(table => ({
                ...table.toObject(),
                is_available_for_time: !reservedTableIds.includes(table._id.toString()),
                is_reserved: reservedTableIds.includes(table._id.toString()),
                current_status: reservedTableIds.includes(table._id.toString()) ? 'reserved' : table.status
            }));

            return res.json({
                success: true,
                data: {
                    area: area,
                    tables: tablesWithAvailability,
                    availability_info: {
                        total_tables: tables.length,
                        available_tables: tablesWithAvailability.filter(t => t.is_available_for_time).length,
                        reserved_tables: reservedTableIds.length,
                        date: date,
                        time: time
                    }
                }
            });
        }

        const tablesWithAvailability = tables.map(table => ({
            ...table.toObject(),
            is_available_for_time: table.status === 'available',
            is_reserved: table.status === 'reserved' || table.status === 'occupied',
            current_status: table.status
        }));

        res.json({
            success: true,
            data: {
                area: area,
                tables: tablesWithAvailability,
                availability_info: {
                    total_tables: tables.length,
                    available_tables: tables.filter(t => t.status === 'available').length,
                    reserved_tables: tables.filter(t => t.status === 'reserved' || t.status === 'occupied').length,
                    date: null,
                    time: null
                }
            }
        });
    } catch (error) {
        console.error('Error fetching area tables:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching area tables',
            error: error.message
        });
    }
});

export default router;