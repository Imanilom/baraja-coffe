// routes/area.routes.js
import express from 'express';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import Reservation from '../models/Reservation.model.js';

const router = express.Router();

// GET /api/areas - Get all areas with real-time availability
router.get('/', async (req, res) => {
    try {
        const { date, time } = req.query;

        // Get all active areas
        const areas = await Area.find({ is_active: true }).sort({ area_code: 1 });

        // If date and time provided, calculate real-time availability
        if (date && time) {
            const areasWithAvailability = await Promise.all(
                areas.map(async (area) => {
                    // Get all tables for this area
                    const tables = await Table.find({
                        area_id: area._id,
                        is_active: true
                    });

                    // Convert date string to Date object for query
                    const reservationDate = new Date(date);

                    // Get existing reservations for this area on the specified date and time
                    const existingReservations = await Reservation.find({
                        reservation_date: {
                            $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                            $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
                        },
                        reservation_time: time,
                        area_id: area._id,
                        status: { $in: ['confirmed', 'pending'] }
                    });

                    // Get reserved table IDs for this time slot
                    const reservedTableIds = [];
                    existingReservations.forEach(reservation => {
                        reservation.table_id.forEach(tableId => {
                            if (!reservedTableIds.includes(tableId.toString())) {
                                reservedTableIds.push(tableId.toString());
                            }
                        });
                    });

                    // Calculate available tables
                    const availableTables = tables.filter(table =>
                        !reservedTableIds.includes(table._id.toString())
                    );

                    // Calculate total guests already reserved
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
                        isFullyBooked: availableTables.length === 0 || availableCapacity <= 0
                    };
                })
            );

            return res.json({
                success: true,
                data: areasWithAvailability
            });
        }

        // If no date/time provided, return areas with basic table info
        const areasWithTables = await Promise.all(
            areas.map(async (area) => {
                const tables = await Table.find({
                    area_id: area._id,
                    is_active: true
                });

                return {
                    ...area.toObject(),
                    totalTables: tables.length,
                    availableTables: tables.length, // Assume all available without date/time
                    reservedTables: 0,
                    availableCapacity: area.capacity,
                    totalReservedGuests: 0,
                    isFullyBooked: false
                };
            })
        );

        res.json({
            success: true,
            data: areasWithTables
        });

    } catch (error) {
        console.error('Error fetching areas:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching areas',
            error: error.message
        });
    }
});

// GET /api/areas/:id/tables - Get tables for specific area with availability
router.get('/:id/tables', async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time } = req.query;

        // Get area information
        const area = await Area.findById(id);
        if (!area || !area.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Area not found or inactive'
            });
        }

        // Get all tables for this area
        const tables = await Table.find({
            area_id: id,
            is_active: true
        }).sort({ table_number: 1 });

        // If date and time provided, check table availability
        if (date && time) {
            const reservationDate = new Date(date);

            // Get existing reservations for this area on the specified date and time
            const existingReservations = await Reservation.find({
                reservation_date: {
                    $gte: new Date(reservationDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(reservationDate.setHours(23, 59, 59, 999))
                },
                reservation_time: time,
                area_id: id,
                status: { $in: ['confirmed', 'pending'] }
            });

            // Get reserved table IDs
            const reservedTableIds = [];
            existingReservations.forEach(reservation => {
                reservation.table_id.forEach(tableId => {
                    if (!reservedTableIds.includes(tableId.toString())) {
                        reservedTableIds.push(tableId.toString());
                    }
                });
            });

            // Mark tables as available or not
            const tablesWithAvailability = tables.map(table => ({
                ...table.toObject(),
                is_available_for_time: !reservedTableIds.includes(table._id.toString()),
                is_reserved: reservedTableIds.includes(table._id.toString())
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

        // If no date/time provided, return tables with default availability
        const tablesWithAvailability = tables.map(table => ({
            ...table.toObject(),
            is_available_for_time: table.is_available,
            is_reserved: false
        }));

        res.json({
            success: true,
            data: {
                area: area,
                tables: tablesWithAvailability,
                availability_info: {
                    total_tables: tables.length,
                    available_tables: tables.length,
                    reserved_tables: 0,
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