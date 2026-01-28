import { Order } from '../../models/order.model.js';
import mongoose from "mongoose";

/**
 * Dashboard Controller - Optimized with MongoDB Aggregation
 * Reduces frontend computation by processing data on backend
 */

class DashboardController {
    /**
     * Get Dashboard Summary Data
     * Returns aggregated data for cards, charts, and tables
     */
    async getDashboardData(req, res) {
        try {
            const { startDate, endDate, outlet } = req.query;

            // Validasi date range
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate and endDate are required'
                });
            }

            // Parse dates
            const start = new Date(startDate + 'T00:00:00.000+07:00');
            const end = new Date(endDate + 'T23:59:59.999+07:00');

            // Build match filter
            const matchFilter = {
                status: 'Completed',
                createdAt: { $gte: start, $lte: end }
            };

            if (outlet) {
                matchFilter.outlet = new mongoose.Types.ObjectId(outlet);
            }

            // Calculate previous range for comparison
            const diffTime = end.getTime() - start.getTime();
            const prevEnd = new Date(start.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - diffTime);
            prevStart.setHours(0, 0, 0, 0);
            prevEnd.setHours(23, 59, 59, 999);

            const prevMatchFilter = {
                status: 'Completed',
                createdAt: { $gte: prevStart, $lte: prevEnd }
            };

            if (outlet) {
                prevMatchFilter.outlet = new mongoose.Types.ObjectId(outlet);
            }

            // Execute aggregations in parallel
            const [
                currentStats,
                previousStats,
                productSummary,
                hourlyData,
                orderTypeData
            ] = await Promise.all([
                // Current period stats
                Order.aggregate([
                    { $match: matchFilter },
                    {
                        $group: {
                            _id: null,
                            totalSales: { $sum: '$grandTotal' },
                            totalOrders: { $sum: 1 },
                            avgOrderValue: { $avg: '$grandTotal' }
                        }
                    }
                ]),

                // Previous period stats
                Order.aggregate([
                    { $match: prevMatchFilter },
                    {
                        $group: {
                            _id: null,
                            totalSales: { $sum: '$grandTotal' },
                            totalOrders: { $sum: 1 }
                        }
                    }
                ]),

                // Product summary with category breakdown
                Order.aggregate([
                    { $match: matchFilter },
                    { $unwind: '$items' },
                    {
                        $lookup: {
                            from: 'menuitems',
                            localField: 'items.menuItem',
                            foreignField: '_id',
                            as: 'menuItemData'
                        }
                    },
                    { $unwind: { path: '$menuItemData', preserveNullAndEmptyArrays: true } },
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'menuItemData.category',
                            foreignField: '_id',
                            as: 'categoryData'
                        }
                    },
                    { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
                    {
                        $group: {
                            _id: {
                                name: {
                                    $ifNull: ['$menuItemData.name', 'Unknown']
                                },
                                mainCategory: {
                                    $ifNull: ['$menuItemData.mainCategory', 'Unknown']
                                },
                                category: {
                                    $ifNull: ['$categoryData.name', 'Uncategorized']
                                },
                                sku: {
                                    $ifNull: ['$menuItemData.sku', '-']
                                }
                            },
                            quantity: { $sum: '$items.quantity' },
                            subtotal: { $sum: '$items.subtotal' },
                            discount: { $sum: { $ifNull: ['$items.discount', 0] } }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            productName: '$_id.name',
                            mainCategory: '$_id.mainCategory',
                            category: '$_id.category',
                            sku: '$_id.sku',
                            quantity: 1,
                            subtotal: 1,
                            discount: 1,
                            total: '$subtotal'
                        }
                    },
                    { $sort: { subtotal: -1 } }
                ]),

                // Hourly breakdown
                Order.aggregate([
                    { $match: matchFilter },
                    {
                        $project: {
                            hour: { $hour: { date: '$createdAt', timezone: 'Asia/Jakarta' } },
                            grandTotal: 1
                        }
                    },
                    {
                        $group: {
                            _id: '$hour',
                            subtotal: { $sum: '$grandTotal' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            time: {
                                $concat: [
                                    { $cond: [{ $lt: ['$_id', 10] }, '0', ''] },
                                    { $toString: '$_id' },
                                    ':00'
                                ]
                            },
                            subtotal: 1
                        }
                    },
                    { $sort: { time: 1 } }
                ]),

                // Order type breakdown
                Order.aggregate([
                    { $match: matchFilter },
                    {
                        $group: {
                            _id: '$orderType',
                            subtotal: { $sum: '$grandTotal' },
                            totalTransaction: { $sum: 1 }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            orderType: { $ifNull: ['$_id', 'Unknown'] },
                            subtotal: 1,
                            totalTransaction: 1
                        }
                    }
                ])
            ]);

            // Process hourly data to include all 24 hours
            const hourlyMap = {};
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                hourlyMap[hour] = { time: hour, subtotal: 0 };
            }
            hourlyData.forEach(item => {
                hourlyMap[item.time] = item;
            });

            // Separate food and drinks
            const foodProducts = productSummary
                .filter(p => p.mainCategory === 'makanan')
                .slice(0, 5)
                .map(p => ({ name: p.productName, value: p.subtotal }));

            const drinkProducts = productSummary
                .filter(p => p.mainCategory === 'minuman')
                .slice(0, 5)
                .map(p => ({ name: p.productName, value: p.subtotal }));

            // Calculate comparison metrics
            const current = currentStats[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 };
            const previous = previousStats[0] || { totalSales: 0, totalOrders: 0 };

            const calculateComparison = (currentVal, previousVal) => {
                const diff = currentVal - previousVal;
                const isPositive = diff >= 0;
                let percentage = '0.00%';

                if (previousVal === 0) {
                    percentage = currentVal === 0 ? '0.00%' : '100.00%';
                } else {
                    percentage = `${((Math.abs(diff) / previousVal) * 100).toFixed(2)}%`;
                }

                return {
                    percentage: isPositive ? `+${percentage}` : `-${percentage}`,
                    amount: Math.abs(diff),
                    isPositive
                };
            };

            // Build response
            const response = {
                success: true,
                data: {
                    // Summary cards data
                    summary: {
                        current: {
                            sales: current.totalSales,
                            orders: current.totalOrders,
                            avgOrderValue: current.avgOrderValue
                        },
                        previous: {
                            sales: previous.totalSales,
                            orders: previous.totalOrders
                        },
                        comparison: {
                            sales: calculateComparison(current.totalSales, previous.totalSales),
                            orders: calculateComparison(current.totalOrders, previous.totalOrders)
                        }
                    },

                    // Product breakdown
                    products: {
                        all: productSummary,
                        top10: productSummary.slice(0, 10),
                        food: foodProducts,
                        drinks: drinkProducts
                    },

                    // Charts data
                    charts: {
                        hourly: Object.values(hourlyMap),
                        orderTypes: orderTypeData,
                        salesByCategory: productSummary.map(p => ({
                            name: p.productName,
                            category: p.mainCategory,
                            value: p.subtotal
                        }))
                    },

                    // Metadata
                    metadata: {
                        dateRange: {
                            start: startDate,
                            end: endDate
                        },
                        previousRange: {
                            start: prevStart.toISOString().split('T')[0],
                            end: prevEnd.toISOString().split('T')[0]
                        },
                        outlet: outlet || 'all',
                        totalProducts: productSummary.length,
                        generatedAt: new Date().toISOString()
                    }
                }
            };

            res.status(200).json(response);

        } catch (error) {
            console.error('Dashboard data error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard data',
                error: error.message
            });
        }
    }

    /**
     * Get Quick Stats Only (for faster initial load)
     * Returns only essential metrics without heavy aggregations
     */
    async getQuickStats(req, res) {
        try {
            const { startDate, endDate, outlet } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'startDate and endDate are required'
                });
            }

            const start = new Date(startDate + 'T00:00:00.000+07:00');
            const end = new Date(endDate + 'T23:59:59.999+07:00');

            const matchFilter = {
                status: 'Completed',
                createdAt: { $gte: start, $lte: end }
            };

            if (outlet) {
                matchFilter.outlet = new mongoose.Types.ObjectId(outlet);
            }

            // Quick aggregation for cards only
            const stats = await Order.aggregate([
                { $match: matchFilter },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$grandTotal' },
                        totalOrders: { $sum: 1 },
                        avgOrderValue: { $avg: '$grandTotal' }
                    }
                }
            ]);

            const result = stats[0] || { totalSales: 0, totalOrders: 0, avgOrderValue: 0 };

            res.status(200).json({
                success: true,
                data: {
                    sales: result.totalSales,
                    orders: result.totalOrders,
                    avgOrderValue: result.avgOrderValue
                }
            });

        } catch (error) {
            console.error('Quick stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch quick stats',
                error: error.message
            });
        }
    }
};

const dashboardController = new DashboardController();
export default dashboardController;