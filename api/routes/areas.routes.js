// routes/area.routes.js
import express from 'express';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import Reservation from '../models/Reservation.model.js';
import mongoose from 'mongoose';
const router = express.Router();

// TABLE CRUD OPERATIONS //

// Create a new table
router.post('/tables', async (req, res) => {
    try {
        const { table_number, area_id, seats, table_type, shape, position } = req.body;

        const area = await Area.findOne({ _id: area_id, is_active: true });
        if (!area) return res.status(400).json({ success: false, message: 'Area not found or inactive' });

        if (position?.x > area.roomSize.width || position?.y > area.roomSize.height) {
            return res.status(400).json({
                success: false,
                message: `Position (${position.x}, ${position.y}) exceeds area size (${area.roomSize.width}, ${area.roomSize.height})`
            });
        }

        const exists = await Table.findOne({ table_number: table_number.toUpperCase(), area_id });
        if (exists) return res.status(400).json({ success: false, message: 'Table number already exists in this area' });

        const newTable = new Table({
            table_number: table_number.toUpperCase(),
            area_id,
            seats: seats || 4,
            table_type: table_type || 'regular',
            shape: shape || 'rectangle',
            position: position || { x: 0, y: 0 }
        });

        const saved = await newTable.save();
        res.status(201).json({ success: true, message: 'Table created successfully', data: saved });
    } catch (error) {
        console.error('Error creating table:', error);
        res.status(500).json({ success: false, message: 'Error creating table', error: error.message });
    }
});

// Get all tables (with optional area filter)
router.get('/tables', async (req, res) => {
    try {
        const { area_id, status, outlet_id } = req.query;
        // Validate that outlet_id is provided
        if (!outlet_id) {
            return res.status(400).json({
                success: false,
                message: 'outlet_id is required'
            });
        }
        // Build the aggregation pipeline
        const pipeline = [
            // Stage 1: Filter by active tables first (optional, for performance)
            {
                $match: {
                    is_active: true
                }
            },
            // Stage 2: Lookup (join) with areas collection to get area details including outlet_id
            {
                $lookup: {
                    from: 'areas',           // Nama koleksi 'areas' di MongoDB
                    localField: 'area_id',   // Field di koleksi 'tables'
                    foreignField: '_id',     // Field di koleksi 'areas'
                    as: 'area_info'          // Nama field baru yang akan dibuat
                }
            },
            // Stage 3: Unwind the array (since lookup returns an array)
            {
                $unwind: "$area_info"
            },
            // Stage 4: Match by outlet_id (and other optional filters)
            {
                $match: {
                    "area_info.outlet_id": new mongoose.Types.ObjectId(outlet_id) // <-- Filter by outlet_id here
                }
            }
        ];
        // Add optional filters
        if (area_id) {
            pipeline.push({
                $match: {
                    area_id: new mongoose.Types.ObjectId(area_id)
                }
            });
        }
        if (status) {
            pipeline.push({
                $match: {
                    status: status
                }
            });
        }
        // Stage: Sort
        pipeline.push({
            $sort: { table_number: 1 }
        });
        // Stage: Optionally project only needed fields and flatten area data
        pipeline.push({
            $project: {
                _id: 1,
                table_number: 1,
                seats: 1,
                capacity: "$seats", // Alias for consistency if frontend expects 'capacity'
                table_type: 1,
                is_available: 1,
                is_active: 1,
                status: 1,
                position: 1,
                shape: 1,
                updatedAt: 1,
                created_at: 1,
                updated_at: 1,
                // Flatten area info into the main document
                area_id: {
                    _id: "$area_info._id",
                    area_code: "$area_info.area_code",
                    area_name: "$area_info.area_name"
                    // Tambahkan field lain dari area jika diperlukan, misalnya:
                    // outlet_id: "$area_info.outlet_id" // Opsional, jika ingin dikirim ke frontend
                }
            }
        });
        // Execute the aggregation
        const tables = await Table.aggregate(pipeline);
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

        const table = await Table.findById(req.params.id);
        if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

        const areaToCheck = area_id ? await Area.findById(area_id) : await Area.findById(table.area_id);
        if (!areaToCheck || !areaToCheck.is_active) {
            return res.status(400).json({ success: false, message: 'Area not found or inactive' });
        }

        if (position?.x > areaToCheck.roomSize.width || position?.y > areaToCheck.roomSize.height) {
            return res.status(400).json({
                success: false,
                message: `Position (${position.x}, ${position.y}) exceeds area size (${areaToCheck.roomSize.width}, ${areaToCheck.roomSize.height})`
            });
        }

        if (table_number) {
            const exists = await Table.findOne({
                table_number: table_number.toUpperCase(),
                area_id: area_id || table.area_id,
                _id: { $ne: req.params.id }
            });
            if (exists) return res.status(400).json({ success: false, message: 'Table number already exists in this area' });
        }

        Object.assign(table, {
            table_number: table_number ? table_number.toUpperCase() : table.table_number,
            area_id: area_id || table.area_id,
            seats: seats ?? table.seats,
            table_type: table_type ?? table.table_type,
            shape: shape ?? table.shape,
            position: position ?? table.position,
            status: status ?? table.status,
            is_available: is_available ?? table.is_available,
            is_active: is_active ?? table.is_active
        });

        const updated = await table.save();
        res.json({ success: true, message: 'Table updated successfully', data: updated });
    } catch (error) {
        console.error('Error updating table:', error);
        res.status(500).json({ success: false, message: 'Error updating table', error: error.message });
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

// AREA CRUD OPERATIONS //

// Create a new area
router.post('/', async (req, res) => {
    try {
        const { area_code, area_name, capacity, description, rentfee, roomSize } = req.body;

        if (!roomSize?.width || !roomSize?.height) {
            return res.status(400).json({ success: false, message: 'Room size (width & height) is required' });
        }

        // Check if area code already exists
        const existingArea = await Area.findOne({ area_code: area_code.toUpperCase() });
        if (existingArea) {
            return res.status(400).json({ success: false, message: 'Area code already exists' });
        }

        const newArea = new Area({
            area_code: area_code.toUpperCase(),
            area_name,
            capacity,
            description: description || '',
            rentfee: rentfee || 0,
            roomSize: {
                width: roomSize.width,
                height: roomSize.height,
                unit: roomSize.unit || 'm'
            }
        });

        const savedArea = await newArea.save();

        res.status(201).json({ success: true, message: 'Area created successfully', data: savedArea });
    } catch (error) {
        console.error('Error creating area:', error);
        res.status(500).json({ success: false, message: 'Error creating area', error: error.message });
    }
});


// Get all areas
router.get('/', async (req, res) => {
    try {
        const { date, time } = req.query;
        const areas = await Area.find({ is_active: true }).sort({ area_code: 1 });

        // If date & time provided → include availability info
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
                    existingReservations.forEach(r => {
                        r.table_id.forEach(tableId => {
                            if (!reservedTableIds.includes(tableId.toString())) {
                                reservedTableIds.push(tableId.toString());
                            }
                        });
                    });

                    const availableTables = tables.filter(t => !reservedTableIds.includes(t._id.toString()));
                    const totalReservedGuests = existingReservations.reduce((sum, r) => sum + r.guest_count, 0);
                    const availableCapacity = Math.max(0, area.capacity - totalReservedGuests);

                    return {
                        ...area.toObject(),
                        totalTables: tables.length,
                        availableTables: availableTables.length,
                        reservedTables: tables.length - availableTables.length,
                        availableCapacity,
                        totalReservedGuests,
                        isFullyBooked: availableTables.length === 0 || availableCapacity <= 0,
                        tables: tables.map(t => ({
                            ...t.toObject(),
                            is_available_for_time: !reservedTableIds.includes(t._id.toString()),
                            is_reserved: reservedTableIds.includes(t._id.toString())
                        }))
                    };
                })
            );

            return res.json({ success: true, data: areasWithAvailability });
        }

        // Default return without reservation check
        const areasWithTables = await Promise.all(
            areas.map(async (area) => {
                const tables = await Table.find({ area_id: area._id, is_active: true });
                return {
                    ...area.toObject(),
                    totalTables: tables.length,
                    availableTables: tables.filter(t => t.status === 'available').length,
                    reservedTables: tables.filter(t => t.status !== 'available').length,
                    availableCapacity: area.capacity,
                    totalReservedGuests: 0,
                    isFullyBooked: false,
                    tables
                };
            })
        );

        res.json({ success: true, data: areasWithTables });
    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({ success: false, message: 'Error fetching areas', error: error.message });
    }
});


// Get single area by ID
router.get('/:id', async (req, res) => {
    try {
        const area = await Area.findById(req.params.id);
        if (!area || !area.is_active) {
            return res.status(404).json({ success: false, message: 'Area not found or inactive' });
        }

        const tables = await Table.find({ area_id: area._id, is_active: true });
        res.json({ success: true, data: { ...area.toObject(), tables } });
    } catch (error) {
        console.error('Error fetching area:', error);
        res.status(500).json({ success: false, message: 'Error fetching area', error: error.message });
    }
});


// Update an area
router.put('/:id', async (req, res) => {
    try {
        const { area_code, area_name, capacity, description, rentfee, is_active, roomSize } = req.body;

        if (area_code) {
            const exists = await Area.findOne({
                area_code: area_code.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (exists) {
                return res.status(400).json({ success: false, message: 'Area code already exists' });
            }
        }

        const updatedArea = await Area.findByIdAndUpdate(
            req.params.id,
            {
                area_code: area_code ? area_code.toUpperCase() : undefined,
                area_name,
                capacity,
                description,
                rentfee,
                is_active,
                roomSize
            },
            { new: true, runValidators: true }
        );

        if (!updatedArea) return res.status(404).json({ success: false, message: 'Area not found' });

        res.json({ success: true, message: 'Area updated successfully', data: updatedArea });
    } catch (error) {
        console.error('Error updating area:', error);
        res.status(500).json({ success: false, message: 'Error updating area', error: error.message });
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

export default router;