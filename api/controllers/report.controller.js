// import { Report } from "../models/Report.model";
import { Order } from "../models/order.model.js";
// import { User } from '../models/user.model.js';
// import { Outlet } from '../models/Outlet.model.js';
import moment from 'moment';
// Validation middleware
export const validateSalesReportQuery = (req, res, next) => {
    const errors = [];
    const {
        startDate,
        endDate,
        page,
        limit,
        cashierId,
        outlet,
        paymentMethod,
        orderType,
        status,
        groupBy
    } = req.query;

    // Validate startDate
    if (startDate && !moment(startDate).isValid()) {
        errors.push({ field: 'startDate', message: 'startDate must be a valid date' });
    }

    // Validate endDate
    if (endDate && !moment(endDate).isValid()) {
        errors.push({ field: 'endDate', message: 'endDate must be a valid date' });
    }

    // Validate date range
    if (startDate && endDate && moment(endDate).isBefore(moment(startDate))) {
        errors.push({ field: 'endDate', message: 'endDate must be after startDate' });
    }

    // Validate page
    if (page && (isNaN(page) || parseInt(page) < 1)) {
        errors.push({ field: 'page', message: 'page must be a positive integer' });
    }

    // Validate limit
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
        errors.push({ field: 'limit', message: 'limit must be between 1 and 100' });
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (cashierId && !objectIdRegex.test(cashierId)) {
        errors.push({ field: 'cashierId', message: 'cashierId must be a valid MongoDB ObjectId' });
    }

    if (outlet && !objectIdRegex.test(outlet)) {
        errors.push({ field: 'outlet', message: 'outlet must be a valid MongoDB ObjectId' });
    }

    // Validate paymentMethod
    const validPaymentMethods = ['Cash', 'Card', 'E-Wallet', 'Debit', 'Bank Transfer', 'No Payment'];
    if (paymentMethod) {
        const methods = paymentMethod.split(',');
        const invalidMethods = methods.filter(method => !validPaymentMethods.includes(method.trim()));
        if (invalidMethods.length > 0) {
            errors.push({ field: 'paymentMethod', message: `Invalid payment methods: ${invalidMethods.join(', ')}` });
        }
    }

    // Validate orderType
    const validOrderTypes = ['Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'];
    if (orderType) {
        const types = orderType.split(',');
        const invalidTypes = types.filter(type => !validOrderTypes.includes(type.trim()));
        if (invalidTypes.length > 0) {
            errors.push({ field: 'orderType', message: `Invalid order types: ${invalidTypes.join(', ')}` });
        }
    }

    // Validate status
    const validStatuses = ['Pending', 'Waiting', 'Reserved', 'OnProcess', 'Completed', 'Canceled'];
    if (status) {
        const statuses = status.split(',');
        const invalidStatuses = statuses.filter(s => !validStatuses.includes(s.trim()));
        if (invalidStatuses.length > 0) {
            errors.push({ field: 'status', message: `Invalid statuses: ${invalidStatuses.join(', ')}` });
        }
    }

    // Validate groupBy
    const validGroupBy = ['day', 'week', 'month'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
        errors.push({ field: 'groupBy', message: 'groupBy must be day, week, or month' });
    }

    // Return errors if any
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: errors
        });
    }

    next();
};

//for cashier
export const salesReport = async (req, res) => {
    try {
        const order = await Order.find();

        res.status(200).json({
            success: true,
            data: order
        });
    } catch {
        res.status(500).json({ message: "Failed to fetch sales report" });
    }
}

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