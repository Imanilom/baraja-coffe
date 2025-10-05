import Reservation from '../models/Reservation.model.js';
import { Order } from "../models/order.model.js";
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';
import User from '../models/user.model.js';
import moment from 'moment-timezone';

// Helper: Get WIB date range for today
const getTodayWIBRange = () => {
    const startOfDay = moment.tz('Asia/Jakarta').startOf('day').toDate();
    const endOfDay = moment.tz('Asia/Jakarta').endOf('day').toDate();
    return { startOfDay, endOfDay };
};

// Helper: Get WIB now
const getWIBNow = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
};

// GET /api/jro/dashboard-stats - Get dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const wibOffset = 7 * 60 * 60 * 1000;
        const wibDate = new Date(now.getTime() + wibOffset);
        const todayStr = wibDate.toISOString().split('T')[0];

        console.log('Looking for reservations on date:', todayStr);

        const todayReservations = await Reservation.aggregate([
            {
                $addFields: {
                    dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$reservation_date" } }
                }
            },
            {
                $match: { dateStr: todayStr }
            }
        ]);

        console.log('Found reservations:', todayReservations.length);

        const pendingReservations = todayReservations.filter(r => r.status === 'pending').length;
        const activeReservations = todayReservations.filter(r =>
            r.status === 'confirmed' &&
            r.check_in_time != null &&
            r.check_out_time == null
        ).length;

        const allReservationsCount = await Reservation.countDocuments();
        const completedReservations = await Reservation.countDocuments({ status: 'completed' });
        const cancelledReservations = await Reservation.countDocuments({ status: 'cancelled' });

        const allActiveTables = await Table.countDocuments({ is_active: true });
        const occupiedTableIds = new Set();

        todayReservations.forEach(reservation => {
            if (['confirmed', 'pending'].includes(reservation.status) && !reservation.check_out_time) {
                reservation.table_id.forEach(tableId => {
                    occupiedTableIds.add(tableId.toString());
                });
            }
        });

        const availableTables = allActiveTables - occupiedTableIds.size;

        const stats = {
            allReservations: allReservationsCount,
            pendingReservations,
            activeReservations,
            completedReservations,
            cancelledReservations,
            availableTables,
            occupiedTables: occupiedTableIds.size,
            totalTables: allActiveTables
        };

        console.log('Dashboard stats:', stats);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
};

// GET /api/jro/reservations - Get all reservations with filters
export const getReservations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            date,
            area_id,
            search
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const filter = {};

        if (status) {
            if (status === 'active') {
                filter.status = 'confirmed';
                filter.check_in_time = { $ne: null };
                filter.check_out_time = null;
            } else {
                filter.status = status;
            }
        }

        if (date) {
            const targetDate = new Date(date);
            if (!isNaN(targetDate.getTime())) {
                filter.reservation_date = {
                    $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(targetDate.setHours(23, 59, 59, 999))
                };
            }
        } else {
            const { startOfDay, endOfDay } = getTodayWIBRange();
            filter.reservation_date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        if (area_id) {
            filter.area_id = area_id;
        }

        if (search) {
            filter.reservation_code = { $regex: search, $options: 'i' };
        }

        const total = await Reservation.countDocuments(filter);

        const reservations = await Reservation.find(filter)
            .populate('area_id', 'area_name area_code capacity')
            .populate('table_id', 'table_number seats')
            .populate('order_id', 'order_id grandTotal status')
            .populate('created_by.employee_id', 'username')
            .populate('checked_in_by.employee_id', 'username')
            .populate('checked_out_by.employee_id', 'username')
            .sort({ reservation_date: 1, reservation_time: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: reservations,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_records: total,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservations',
            error: error.message
        });
    }
};

// GET /api/jro/reservations/:id - Get single reservation detail
export const getReservationDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code capacity description')
            .populate('table_id', 'table_number seats table_type')
            .populate('created_by.employee_id', 'username email')
            .populate('checked_in_by.employee_id', 'username email')
            .populate('checked_out_by.employee_id', 'username email')
            .populate({
                path: 'order_id',
                select: 'order_id items grandTotal totalBeforeDiscount totalAfterDiscount totalTax totalServiceFee status paymentMethod',
                populate: {
                    path: 'items.menuItem',
                    select: 'name price imageURL'
                }
            });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.json({
            success: true,
            data: reservation
        });
    } catch (error) {
        console.error('Error fetching reservation detail:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reservation detail',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/confirm - Confirm reservation
export const confirmReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot confirm cancelled reservation'
            });
        }

        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Reservation already completed'
            });
        }

        reservation.status = 'confirmed';
        await reservation.save();

        const updated = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats');

        res.json({
            success: true,
            message: 'Reservation confirmed successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error confirming reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error confirming reservation',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/check-in - Check-in reservation
export const checkInReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id; // Dari auth middleware

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot check-in cancelled reservation'
            });
        }

        if (reservation.check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Reservation already checked in'
            });
        }

        // Get employee info
        const employee = await User.findById(userId).select('username');

        reservation.check_in_time = getWIBNow();
        reservation.checked_in_by = {
            employee_id: userId,
            employee_name: employee?.username || 'Unknown',
            checked_in_at: getWIBNow()
        };
        reservation.status = 'confirmed';

        await reservation.save();

        const updated = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats')
            .populate('checked_in_by.employee_id', 'username');

        res.json({
            success: true,
            message: 'Reservation checked in successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error checking in reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking in reservation',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/check-out - Check-out reservation
export const checkOutReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (!reservation.check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Cannot check-out before check-in'
            });
        }

        if (reservation.check_out_time) {
            return res.status(400).json({
                success: false,
                message: 'Reservation already checked out'
            });
        }

        // Get employee info
        const employee = await User.findById(userId).select('username');

        reservation.check_out_time = getWIBNow();
        reservation.checked_out_by = {
            employee_id: userId,
            employee_name: employee?.username || 'Unknown',
            checked_out_at: getWIBNow()
        };

        await reservation.save();

        const updated = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats')
            .populate('checked_out_by.employee_id', 'username');

        res.json({
            success: true,
            message: 'Reservation checked out successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error checking out reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking out reservation',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/complete - Complete reservation
export const completeReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { closeOpenBill = false } = req.body;
        const userId = req.user?.id;

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Cannot complete cancelled reservation'
            });
        }

        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Reservation already completed'
            });
        }

        // Auto check-out if not already done
        if (!reservation.check_out_time) {
            const employee = await User.findById(userId).select('username');
            reservation.check_out_time = getWIBNow();
            reservation.checked_out_by = {
                employee_id: userId,
                employee_name: employee?.username || 'Unknown',
                checked_out_at: getWIBNow()
            };
        }

        reservation.status = 'completed';
        await reservation.save();

        // Handle open bill closure
        if (closeOpenBill && reservation.order_id) {
            const order = await Order.findById(reservation.order_id);
            if (order && order.isOpenBill) {
                order.isOpenBill = false;
                await order.save();
            }
        }

        const updated = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats')
            .populate('order_id', 'order_id grandTotal status')
            .populate('checked_out_by.employee_id', 'username');

        res.json({
            success: true,
            message: 'Reservation completed successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error completing reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing reservation',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/cancel - Cancel reservation
export const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed reservation'
            });
        }

        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Reservation already cancelled'
            });
        }

        reservation.status = 'cancelled';
        if (reason) {
            reservation.notes = `Cancelled: ${reason}. ${reservation.notes}`;
        }
        await reservation.save();

        if (reservation.order_id) {
            await Order.findByIdAndUpdate(reservation.order_id, {
                status: 'Canceled'
            });
        }

        const updated = await Reservation.findById(id)
            .populate('area_id', 'area_name area_code')
            .populate('table_id', 'table_number seats');

        res.json({
            success: true,
            message: 'Reservation cancelled successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling reservation',
            error: error.message
        });
    }
};

// PUT /api/jro/reservations/:id/close-open-bill - Close open bill status
export const closeOpenBill = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findById(id).populate('order_id');
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        if (!reservation.order_id) {
            return res.status(400).json({
                success: false,
                message: 'No order associated with this reservation'
            });
        }

        const order = await Order.findById(reservation.order_id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!order.isOpenBill) {
            return res.status(400).json({
                success: false,
                message: 'Order is not an open bill'
            });
        }

        order.isOpenBill = false;
        await order.save();

        res.json({
            success: true,
            message: 'Open bill closed successfully',
            data: {
                reservation_id: reservation._id,
                order_id: order._id,
                order_code: order.order_id,
                isOpenBill: order.isOpenBill
            }
        });
    } catch (error) {
        console.error('Error closing open bill:', error);
        res.status(500).json({
            success: false,
            message: 'Error closing open bill',
            error: error.message
        });
    }
};

// GET /api/jro/tables/availability - Get real-time table availability
export const getTableAvailability = async (req, res) => {
    try {
        const { date, time, area_id } = req.query;

        let targetDate;
        if (date) {
            targetDate = new Date(date);
        } else {
            targetDate = new Date();
        }

        const filter = {
            reservation_date: {
                $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                $lt: new Date(targetDate.setHours(23, 59, 59, 999))
            },
            status: { $in: ['confirmed', 'pending'] }
        };

        if (time) {
            filter.reservation_time = time;
        }

        if (area_id) {
            filter.area_id = area_id;
        }

        const reservations = await Reservation.find(filter).select('table_id');

        const occupiedTableIds = new Set();
        reservations.forEach(reservation => {
            reservation.table_id.forEach(tableId => {
                occupiedTableIds.add(tableId.toString());
            });
        });

        const tableFilter = area_id ? { area_id, is_active: true } : { is_active: true };
        const allTables = await Table.find(tableFilter)
            .populate('area_id', 'area_name area_code');

        const tablesWithStatus = allTables.map(table => ({
            _id: table._id,
            table_number: table.table_number,
            seats: table.seats,
            table_type: table.table_type,
            area: table.area_id,
            is_available: !occupiedTableIds.has(table._id.toString()),
            is_active: table.is_active
        }));

        res.json({
            success: true,
            data: {
                tables: tablesWithStatus,
                summary: {
                    total: allTables.length,
                    available: tablesWithStatus.filter(t => t.is_available).length,
                    occupied: occupiedTableIds.size
                }
            }
        });
    } catch (error) {
        console.error('Error fetching table availability:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching table availability',
            error: error.message
        });
    }
};