import { Order } from "../models/order.model.js";
// import { User } from '../models/user.model.js';
// import { Outlet } from '../models/Outlet.model.js';
import moment from 'moment';

export const getSalesSummary = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            cashierId,
            outletId,
            paymentMethod,
            orderType
        } = req.query;

        // Build filter
        const filter = {
            status: 'Completed'
        };

        const orders = await Order.find();
        // .populate({
        //     path: 'cashier',
        //     select: '_id name' // Hanya pilih _id dan name dari cashier
        // });

        const toObjectId = (id) => {
            if (!id) return null;
            try {
                // const trimId = id.trim(); // Hapus spasi di awal/akhir
                return new mongoose.Types.ObjectId(id);
            } catch (error) {
                console.warn(`Invalid ObjectId: ${id}`);
                return null;
            }
        };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        // Convert ObjectId fields properly
        if (cashierId) {
            const cashierObjectId = toObjectId(cashierId);
            if (cashierObjectId) {
                filter.cashierId = cashierObjectId;
            }
        }

        if (outletId) {
            const outletObjectId = toObjectId(outletId);
            if (outletObjectId) {
                filter.outlet = outletObjectId;
            }
        }
        if (paymentMethod) filter.paymentMethod = { $in: paymentMethod.split(',') };
        if (orderType) filter.orderType = { $in: orderType.split(',') };

        // Summary stats
        const summaryPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: '$grandTotal' },
                    totalTransactions: { $sum: 1 },
                    totalTax: { $sum: '$totalTax' },
                    totalServiceFee: { $sum: '$totalServiceFee' },
                    totalItems: { $sum: { $size: '$items' } },
                    avgOrderValue: { $avg: '$grandTotal' },
                    totalDiscount: {
                        $sum: {
                            $add: [
                                '$discounts.autoPromoDiscount',
                                '$discounts.manualDiscount',
                                '$discounts.voucherDiscount'
                            ]
                        }
                    }
                }
            }
        ];

        // Payment method breakdown
        const paymentBreakdownPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$paymentMethod',
                    total: { $sum: '$grandTotal' },
                    count: { $sum: 1 }
                }
            }
        ];

        // Order type breakdown
        const orderTypeBreakdownPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$orderType',
                    count: { $sum: 1 },
                    total: { $sum: '$grandTotal' }
                }
            }
        ];

        const [summaryResult, paymentBreakdown, orderTypeBreakdown] = await Promise.all([
            Order.aggregate(summaryPipeline),
            Order.aggregate(paymentBreakdownPipeline),
            Order.aggregate(orderTypeBreakdownPipeline)
        ]);

        const summary = summaryResult[0] || {
            totalSales: 0,
            totalTransactions: 0,
            totalTax: 0,
            totalServiceFee: 0,
            avgOrderValue: 0,
            totalDiscount: 0
        };

        // Calculate percentages for payment methods
        const totalSalesForPayment = paymentBreakdown.reduce((sum, item) => sum + item.total, 0);
        const paymentMethodData = paymentBreakdown.map(item => ({
            method: item._id,
            amount: item.total,
            count: item.count,
            percentage: totalSalesForPayment > 0 ? ((item.total / totalSalesForPayment) * 100).toFixed(1) : '0.0'
        }));

        // Calculate percentages for order types
        const totalOrdersForType = orderTypeBreakdown.reduce((sum, item) => sum + item.count, 0);
        const orderTypeData = orderTypeBreakdown.map(item => ({
            type: item._id,
            count: item.count,
            total: item.total,
            percentage: totalOrdersForType > 0 ? ((item.count / totalOrdersForType) * 100).toFixed(1) : '0.0'
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalSales: summary.totalSales,
                    totalTransactions: summary.totalTransactions,
                    avgOrderValue: Math.round(summary.avgOrderValue),
                    totalTax: summary.totalTax,
                    totalServiceFee: summary.totalServiceFee,
                    totalDiscount: summary.totalDiscount,
                    totalItems: summary.totalItems
                },
                paymentMethodBreakdown: paymentMethodData,
                orderTypeBreakdown: orderTypeData
            }
        });

    } catch (error) {
        console.error('Error in getSalesSummary:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * API untuk Tab Detail Order - Order Details dengan pagination
 * GET /api/sales-report/orders
 */
export const getOrderDetails = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            cashierId,
            outlet,
            paymentMethod,
            orderType,
            page = 1,
            limit = 20
        } = req.query;

        const filter = { status: 'Completed' };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;
        if (paymentMethod) filter.paymentMethod = { $in: paymentMethod.split(',') };
        if (orderType) filter.orderType = { $in: orderType.split(',') };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, totalCount] = await Promise.all([
            Order.find(filter)
                .populate('cashierId', 'name email')
                .populate('outlet', 'name')
                .populate('items.menuItem', 'name price mainCategory')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        const formattedOrders = orders.map(order => ({
            orderId: order.order_id,
            createdAt: order.createdAt,
            customerName: order.user,
            cashier: order.cashierId?.name || 'Unknown',
            outlet: order.outlet?.name || 'Unknown',
            orderType: order.orderType,
            tableNumber: order.tableNumber || '',
            paymentMethod: order.paymentMethod,
            status: order.status,
            items: order.items.map(item => ({
                name: item.menuItem?.name || 'Unknown Item',
                quantity: item.quantity,
                price: item.menuItem?.price || 0,
                subtotal: item.subtotal,
                category: item.menuItem?.mainCategory || '',
                selectedAddons: item.selectedAddons?.map(addon => addon.name) || [],
                notes: item.notes || ''
            })),
            pricing: {
                totalBeforeDiscount: order.totalBeforeDiscount,
                totalDiscount: order.discounts.autoPromoDiscount + order.discounts.manualDiscount + order.discounts.voucherDiscount,
                totalTax: order.totalTax,
                totalServiceFee: order.totalServiceFee,
                grandTotal: order.grandTotal
            }
        }));

        res.status(200).json({
            success: true,
            data: {
                orders: formattedOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalOrders: totalCount,
                    hasNext: skip + parseInt(limit) < totalCount,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error in getOrderDetails:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * API untuk Tab Analisis - Charts & Analytics
 * GET /api/sales-report/analytics
 */
export const getSalesAnalytics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            cashierId,
            outlet,
            groupBy = 'hour' // hour, day, week, month
        } = req.query;

        const filter = { status: 'Completed' };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;

        // Hourly sales chart data
        const hourlySalesPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: { $hour: '$createdAt' },
                    totalSales: { $sum: '$grandTotal' },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ];

        // Top selling items
        const topItemsPipeline = [
            { $match: filter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.menuItem',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ];

        // Daily trend for the period
        const dailyTrendPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalSales: { $sum: '$grandTotal' },
                    totalOrders: { $sum: 1 },
                    avgOrderValue: { $avg: '$grandTotal' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ];

        const [hourlySales, topItems, dailyTrend] = await Promise.all([
            Order.aggregate(hourlySalesPipeline),
            Order.aggregate(topItemsPipeline),
            Order.aggregate(dailyTrendPipeline)
        ]);

        // Format hourly sales data (create full 24-hour array)
        const hourlyData = Array.from({ length: 24 }, (_, hour) => {
            const found = hourlySales.find(item => item._id === hour);
            return {
                hour,
                totalSales: found?.totalSales || 0,
                totalOrders: found?.totalOrders || 0
            };
        });

        const formattedTopItems = topItems.map((item, index) => ({
            rank: index + 1,
            menuItem: {
                id: item.menuItem._id,
                name: item.menuItem.name,
                price: item.menuItem.price,
                category: item.menuItem.mainCategory
            },
            totalQuantity: item.totalQuantity,
            totalRevenue: item.totalRevenue,
            orderCount: item.orderCount,
            avgQuantityPerOrder: (item.totalQuantity / item.orderCount).toFixed(1)
        }));

        const formattedDailyTrend = dailyTrend.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            totalSales: item.totalSales,
            totalOrders: item.totalOrders,
            avgOrderValue: Math.round(item.avgOrderValue)
        }));

        res.status(200).json({
            success: true,
            data: {
                hourlySales: hourlyData,
                topSellingItems: formattedTopItems,
                dailyTrend: formattedDailyTrend
            }
        });

    } catch (error) {
        console.error('Error in getSalesAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * API untuk Tab Performa - Cashier Performance
 * GET /api/sales-report/performance
 */
export const getCashierPerformance = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            outlet
        } = req.query;

        const filter = { status: 'Completed' };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        if (outlet) filter.outlet = outlet;

        // Cashier performance
        const cashierPerformancePipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$cashierId',
                    totalTransactions: { $sum: 1 },
                    totalSales: { $sum: '$grandTotal' },
                    avgOrderValue: { $avg: '$grandTotal' },
                    totalItems: { $sum: { $size: '$items' } },
                    avgItemsPerOrder: { $avg: { $size: '$items' } }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            { $unwind: '$cashier' },
            { $sort: { totalSales: -1 } }
        ];

        // Daily performance trend
        const dailyPerformancePipeline = [
            { $match: filter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalSales: { $sum: '$grandTotal' },
                    totalOrders: { $sum: 1 },
                    totalCashiers: { $addToSet: '$cashierId' }
                }
            },
            {
                $addFields: {
                    totalCashiers: { $size: '$totalCashiers' },
                    avgSalesPerCashier: { $divide: ['$totalSales', { $size: '$totalCashiers' }] }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ];

        const [cashierPerformance, dailyPerformance] = await Promise.all([
            Order.aggregate(cashierPerformancePipeline),
            Order.aggregate(dailyPerformancePipeline)
        ]);

        const formattedCashierPerformance = cashierPerformance.map(item => ({
            cashier: {
                id: item.cashier._id,
                name: item.cashier.name,
                email: item.cashier.email
            },
            performance: {
                totalTransactions: item.totalTransactions,
                totalSales: item.totalSales,
                avgOrderValue: Math.round(item.avgOrderValue),
                totalItems: item.totalItems,
                avgItemsPerOrder: item.avgItemsPerOrder.toFixed(1)
            }
        }));

        const formattedDailyPerformance = dailyPerformance.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            totalSales: item.totalSales,
            totalOrders: item.totalOrders,
            totalCashiers: item.totalCashiers,
            avgSalesPerCashier: Math.round(item.avgSalesPerCashier)
        }));

        res.status(200).json({
            success: true,
            data: {
                cashierPerformance: formattedCashierPerformance,
                dailyPerformanceTrend: formattedDailyPerformance
            }
        });

    } catch (error) {
        console.error('Error in getCashierPerformance:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * API untuk Export CSV
 * GET /api/sales-report/export/csv
 */
export const exportToCSV = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            cashierId,
            outlet,
            paymentMethod,
            orderType
        } = req.query;

        const filter = { status: 'Completed' };

        // Apply filters
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            if (endDate) filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
        }

        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;
        if (paymentMethod) filter.paymentMethod = { $in: paymentMethod.split(',') };
        if (orderType) filter.orderType = { $in: orderType.split(',') };

        const orders = await Order.find(filter)
            .populate('cashierId', 'name')
            .populate('outlet', 'name')
            .populate('items.menuItem', 'name price mainCategory')
            .sort({ createdAt: -1 })
            .lean();

        // Format data for CSV
        const csvData = orders.flatMap(order =>
            order.items.map(item => ({
                'Order ID': order.order_id,
                'Tanggal': moment(order.createdAt).format('DD/MM/YYYY'),
                'Waktu': moment(order.createdAt).format('HH:mm'),
                'Customer': order.user,
                'Kasir': order.cashierId?.name || 'Unknown',
                'Outlet': order.outlet?.name || 'Unknown',
                'Tipe Order': order.orderType,
                'Meja': order.tableNumber || '',
                'Metode Pembayaran': order.paymentMethod,
                'Item': item.menuItem?.name || 'Unknown',
                'Kategori': item.menuItem?.mainCategory || '',
                'Quantity': item.quantity,
                'Harga Satuan': item.menuItem?.price || 0,
                'Subtotal': item.subtotal,
                'Total Sebelum Diskon': order.totalBeforeDiscount,
                'Total Diskon': order.discounts.autoPromoDiscount + order.discounts.manualDiscount + order.discounts.voucherDiscount,
                'Pajak': order.totalTax,
                'Service Fee': order.totalServiceFee,
                'Grand Total': order.grandTotal,
                'Status': order.status
            }))
        );

        // Generate CSV content
        if (csvData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No data found for the selected period'
            });
        }

        const headers = Object.keys(csvData[0]);
        const csvContent = [
            headers.join(','),
            ...csvData.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    const stringValue = String(value || '');
                    return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
                        ? `"${stringValue.replace(/"/g, '""')}"`
                        : stringValue;
                }).join(',')
            )
        ].join('\n');

        const filename = `sales-report-${moment().format('YYYY-MM-DD-HHmmss')}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error in exportToCSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export CSV',
            error: error.message
        });
    }
};

/**
 * API untuk mendapatkan list kasir untuk filter dropdown
 * GET /api/sales-report/cashiers
 */
export const getCashiersList = async (req, res) => {
    try {
        const { outlet } = req.query;

        // Get distinct cashiers from orders
        const matchStage = { status: 'Completed' };
        if (outlet) matchStage.outlet = outlet;

        const cashiers = await Order.aggregate([
            { $match: matchStage },
            { $group: { _id: '$cashierId' } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            { $unwind: '$cashier' },
            {
                $project: {
                    id: '$cashier._id',
                    name: '$cashier.name',
                    email: '$cashier.email'
                }
            },
            { $sort: { name: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: { cashiers }
        });

    } catch (error) {
        console.error('Error in getCashiersList:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cashiers list',
            error: error.message
        });
    }
};


//yang lalu
export const getCashierSalesReport = async (req, res) => {
    try {
        const {
            cashierId,
            startDate,
            endDate,
            outlet,
            paymentMethod,
            orderType,
            status = 'Completed',
            page = 1,
            limit = 10
        } = req.query;

        // Build filter object
        const filter = {
            status: { $in: status.split(',') }
        };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        // Additional filters
        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;
        if (paymentMethod) filter.paymentMethod = { $in: paymentMethod.split(',') };
        if (orderType) filter.orderType = { $in: orderType.split(',') };

        // Get summary data
        const summaryPipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$cashierId',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$grandTotal' },
                    totalBeforeDiscount: { $sum: '$totalBeforeDiscount' },
                    totalDiscount: { $sum: { $add: ['$discounts.autoPromoDiscount', '$discounts.manualDiscount', '$discounts.voucherDiscount'] } },
                    totalTax: { $sum: '$totalTax' },
                    totalServiceFee: { $sum: '$totalServiceFee' },
                    avgOrderValue: { $avg: '$grandTotal' },
                    orders: { $push: '$$ROOT' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'cashier'
                }
            },
            {
                $lookup: {
                    from: 'outlets',
                    localField: 'orders.outlet',
                    foreignField: '_id',
                    as: 'outletInfo'
                }
            }
        ];

        const summaryResult = await Order.aggregate(summaryPipeline);

        // Get detailed orders with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const ordersQuery = Order.find(filter)
            .populate('cashierId', 'name email')
            .populate('outlet', 'name address')
            .populate('items.menuItem', 'name price mainCategory workstation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const [orders, totalCount] = await Promise.all([
            ordersQuery.exec(),
            Order.countDocuments(filter)
        ]);

        // Format response
        const response = {
            summary: summaryResult.map(item => ({
                cashierId: item._id,
                cashierName: item.cashier[0]?.name || 'Unknown',
                cashierEmail: item.cashier[0]?.email || '',
                totalOrders: item.totalOrders,
                totalRevenue: item.totalRevenue,
                totalBeforeDiscount: item.totalBeforeDiscount,
                totalDiscount: item.totalDiscount,
                totalTax: item.totalTax,
                totalServiceFee: item.totalServiceFee,
                avgOrderValue: Math.round(item.avgOrderValue),
                profitMargin: item.totalBeforeDiscount > 0
                    ? ((item.totalRevenue - item.totalBeforeDiscount) / item.totalBeforeDiscount * 100).toFixed(2)
                    : 0
            })),
            orders: orders.map(order => ({
                _id: order._id,
                order_id: order.order_id,
                customerName: order.user,
                cashier: {
                    id: order.cashierId?._id,
                    name: order.cashierId?.name || 'Unknown'
                },
                outlet: {
                    id: order.outlet?._id,
                    name: order.outlet?.name || 'Unknown'
                },
                items: order.items.map(item => ({
                    menuItem: {
                        name: item.menuItem?.name,
                        price: item.menuItem?.price,
                        category: item.menuItem?.mainCategory,
                        workstation: item.menuItem?.workstation
                    },
                    quantity: item.quantity,
                    subtotal: item.subtotal,
                    selectedAddons: item.selectedAddons?.map(addon => ({
                        name: addon.name,
                        totalPrice: addon.options?.reduce((sum, opt) => sum + opt.price, 0) || 0
                    })) || [],
                    selectedToppings: item.selectedToppings || [],
                    notes: item.notes
                })),
                orderDetails: {
                    status: order.status,
                    paymentMethod: order.paymentMethod,
                    orderType: order.orderType,
                    tableNumber: order.tableNumber,
                    type: order.type
                },
                pricing: {
                    totalBeforeDiscount: order.totalBeforeDiscount,
                    discounts: {
                        autoPromo: order.discounts.autoPromoDiscount,
                        manual: order.discounts.manualDiscount,
                        voucher: order.discounts.voucherDiscount,
                        total: order.discounts.autoPromoDiscount + order.discounts.manualDiscount + order.discounts.voucherDiscount
                    },
                    totalAfterDiscount: order.totalAfterDiscount,
                    tax: order.totalTax,
                    serviceFee: order.totalServiceFee,
                    grandTotal: order.grandTotal
                },
                timestamps: {
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt
                }
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
                totalOrders: totalCount,
                hasNext: skip + parseInt(limit) < totalCount,
                hasPrev: parseInt(page) > 1
            },
            filters: {
                dateRange: {
                    startDate: startDate || null,
                    endDate: endDate || null
                },
                cashierId,
                outlet,
                paymentMethod,
                orderType,
                status
            }
        };

        res.status(200).json({
            success: true,
            message: 'Sales report retrieved successfully',
            data: response
        });

    } catch (error) {
        console.error('Error in getCashierSalesReport:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const getCashierSalesAnalytics = async (req, res) => {
    try {
        const {
            cashierId,
            startDate,
            endDate,
            outlet,
            groupBy = 'day' // day, week, month
        } = req.query;

        const filter = {
            status: 'Completed'
        };

        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            }
            if (endDate) {
                filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
            }
        }

        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;

        // Group by time period
        let groupFormat;
        switch (groupBy) {
            case 'week':
                groupFormat = {
                    year: { $year: '$createdAt' },
                    week: { $week: '$createdAt' }
                };
                break;
            case 'month':
                groupFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                };
                break;
            default: // day
                groupFormat = {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' },
                    day: { $dayOfMonth: '$createdAt' }
                };
        }

        const analyticsQuery = [
            { $match: filter },
            {
                $group: {
                    _id: groupFormat,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$grandTotal' },
                    totalItems: { $sum: { $size: '$items' } },
                    avgOrderValue: { $avg: '$grandTotal' },
                    paymentMethods: {
                        $push: '$paymentMethod'
                    },
                    orderTypes: {
                        $push: '$orderType'
                    }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ];

        // Top selling items
        const topItemsQuery = [
            { $match: filter },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.menuItem',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ];

        const [analytics, topItems] = await Promise.all([
            Order.aggregate(analyticsQuery),
            Order.aggregate(topItemsQuery)
        ]);

        res.status(200).json({
            success: true,
            data: {
                timeSeriesData: analytics.map(item => ({
                    date: item._id,
                    totalOrders: item.totalOrders,
                    totalRevenue: item.totalRevenue,
                    totalItems: item.totalItems,
                    avgOrderValue: Math.round(item.avgOrderValue)
                })),
                topSellingItems: topItems.map(item => ({
                    menuItem: {
                        id: item.menuItem._id,
                        name: item.menuItem.name,
                        price: item.menuItem.price,
                        category: item.menuItem.mainCategory
                    },
                    totalQuantity: item.totalQuantity,
                    totalRevenue: item.totalRevenue,
                    orderCount: item.orderCount,
                    avgQuantityPerOrder: (item.totalQuantity / item.orderCount).toFixed(2)
                }))
            }
        });

    } catch (error) {
        console.error('Error in getSalesAnalytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const exportCashierSalesReport = async (req, res) => {
    try {
        const {
            cashierId,
            startDate,
            endDate,
            outlet,
            format = 'csv'
        } = req.query;

        const filter = { status: 'Completed' };

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = moment(startDate).startOf('day').toDate();
            if (endDate) filter.createdAt.$lte = moment(endDate).endOf('day').toDate();
        }

        if (cashierId) filter.cashierId = cashierId;
        if (outlet) filter.outlet = outlet;

        const orders = await Order.find(filter)
            .populate('cashierId', 'name')
            .populate('outlet', 'name')
            .populate('items.menuItem', 'name price mainCategory')
            .sort({ createdAt: -1 });

        if (format === 'csv') {
            const csvData = orders.flatMap(order =>
                order.items.map(item => ({
                    'Order ID': order.order_id,
                    'Date': moment(order.createdAt).format('DD/MM/YYYY HH:mm'),
                    'Customer': order.user,
                    'Cashier': order.cashierId?.name || 'Unknown',
                    'Outlet': order.outlet?.name || 'Unknown',
                    'Item Name': item.menuItem?.name || 'Unknown',
                    'Category': item.menuItem?.mainCategory || '',
                    'Quantity': item.quantity,
                    'Unit Price': item.menuItem?.price || 0,
                    'Subtotal': item.subtotal,
                    'Payment Method': order.paymentMethod,
                    'Order Type': order.orderType,
                    'Table': order.tableNumber || '',
                    'Total Before Discount': order.totalBeforeDiscount,
                    'Total Discount': order.discounts.autoPromoDiscount + order.discounts.manualDiscount + order.discounts.voucherDiscount,
                    'Tax': order.totalTax,
                    'Service Fee': order.totalServiceFee,
                    'Grand Total': order.grandTotal
                }))
            );

            // Convert to CSV string
            const headers = Object.keys(csvData[0] || {});
            const csvContent = [
                headers.join(','),
                ...csvData.map(row => headers.map(header => `"${row[header]}"`).join(','))
            ].join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=sales-report-${moment().format('YYYY-MM-DD')}.csv`);
            res.send(csvContent);
        } else {
            res.status(400).json({
                success: false,
                message: 'Unsupported export format'
            });
        }

    } catch (error) {
        console.error('Error in exportSalesReport:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};