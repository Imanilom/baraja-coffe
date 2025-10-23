import mongoose from "mongoose";
import { Order } from '../../models/order.model.js';
import Payment from '../../models/Payment.model.js';

export const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId } = req.query;

    // Validasi tanggal
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    // Parse tanggal dan konversi ke WIB
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Sampai akhir hari

    // Pipeline aggregation untuk report penjualan
    const salesReport = await Order.aggregate([
      {
        $match: {
          createdAtWIB: {
            $gte: start,
            $lte: end
          },
          ...(outletId && { outlet: new mongoose.Types.ObjectId(outletId) }),
          status: { $in: ['Completed', 'OnProcess'] } // Hanya order yang completed/on process
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'payments'
        }
      },
      {
        $unwind: {
          path: '$payments',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: {
          'payments.status': { $in: ['settlement', 'paid'] } // Hanya payment yang sukses
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAtWIB', timezone: 'Asia/Jakarta' } },
            paymentMethod: '$paymentMethod'
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
          totalAmount: { $sum: '$payments.amount' },
          orderIds: { $addToSet: '$order_id' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          paymentBreakdown: {
            $push: {
              paymentMethod: '$_id.paymentMethod',
              totalOrders: '$totalOrders',
              totalRevenue: '$totalRevenue',
              totalAmount: '$totalAmount',
              orderIds: '$orderIds'
            }
          },
          dailyTotalOrders: { $sum: '$totalOrders' },
          dailyTotalRevenue: { $sum: '$totalRevenue' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Pipeline untuk detail payment channel
    const paymentDetails = await Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end
          },
          status: { $in: ['settlement', 'paid'] }
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'order'
        }
      },
      {
        $unwind: '$order'
      },
      {
        $match: {
          ...(outletId && { 'order.outlet': new mongoose.Types.ObjectId(outletId) }),
          'order.status': { $in: ['Completed', 'OnProcess'] }
        }
      },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          orders: { $addToSet: '$order_id' },
          // Untuk QRIS, breakdown berdasarkan issuer/acquirer
          qrisDetails: {
            $push: {
              $cond: [
                { $eq: ['$method', 'qris'] },
                {
                  issuer: '$raw_response.issuer',
                  acquirer: '$raw_response.acquirer',
                  amount: '$amount',
                  orderId: '$order_id'
                },
                null
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          totalTransactions: 1,
          totalOrders: { $size: '$orders' },
          qrisBreakdown: {
            $filter: {
              input: '$qrisDetails',
              as: 'detail',
              cond: { $ne: ['$$detail', null] }
            }
          }
        }
      }
    ]);

    // Process QRIS breakdown
    const qrisBreakdown = await processQRISBreakdown(paymentDetails);

    // Process payment channel summary
    const paymentChannelSummary = await generatePaymentChannelSummary(paymentDetails, qrisBreakdown);

    // Format final response
    const finalReport = {
      period: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        timezone: 'Asia/Jakarta'
      },
      summary: {
        totalRevenue: salesReport.reduce((sum, day) => sum + day.dailyTotalRevenue, 0),
        totalOrders: salesReport.reduce((sum, day) => sum + day.dailyTotalOrders, 0),
        totalTransactions: paymentDetails.reduce((sum, method) => sum + method.totalTransactions, 0)
      },
      dailyBreakdown: salesReport,
      paymentChannelSummary: paymentChannelSummary,
      qrisDetailedBreakdown: qrisBreakdown
    };

    return res.status(200).json({
      success: true,
      data: finalReport
    });

  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function untuk memproses breakdown QRIS
const processQRISBreakdown = async (paymentDetails) => {
  const qrisData = paymentDetails.find(p => p._id === 'qris');

  if (!qrisData || !qrisData.qrisBreakdown) {
    return {};
  }

  const breakdown = {
    byIssuer: {},
    byAcquirer: {},
    summary: {
      totalAmount: qrisData.totalAmount,
      totalTransactions: qrisData.totalTransactions
    }
  };

  qrisData.qrisBreakdown.forEach(transaction => {
    // Breakdown by issuer (bank/ewallet yang digunakan customer)
    const issuer = transaction.issuer || 'Unknown Issuer';
    if (!breakdown.byIssuer[issuer]) {
      breakdown.byIssuer[issuer] = {
        totalAmount: 0,
        totalTransactions: 0,
        orders: []
      };
    }
    breakdown.byIssuer[issuer].totalAmount += transaction.amount;
    breakdown.byIssuer[issuer].totalTransactions += 1;
    breakdown.byIssuer[issuer].orders.push(transaction.orderId);

    // Breakdown by acquirer (payment processor)
    const acquirer = transaction.acquirer || 'Unknown Acquirer';
    if (!breakdown.byAcquirer[acquirer]) {
      breakdown.byAcquirer[acquirer] = {
        totalAmount: 0,
        totalTransactions: 0,
        orders: []
      };
    }
    breakdown.byAcquirer[acquirer].totalAmount += transaction.amount;
    breakdown.byAcquirer[acquirer].totalTransactions += 1;
    breakdown.byAcquirer[acquirer].orders.push(transaction.orderId);
  });

  return breakdown;
};

// Helper function untuk generate payment channel summary
const generatePaymentChannelSummary = (paymentDetails, qrisBreakdown) => {
  const summary = {
    mandiri: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    bsi: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    bca: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    qris: {
      totalAmount: qrisBreakdown.summary?.totalAmount || 0,
      totalTransactions: qrisBreakdown.summary?.totalTransactions || 0,
      totalOrders: 0
    },
    shopeepay: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    gopay: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    cash: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    card: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 },
    other: { totalAmount: 0, totalTransactions: 0, totalOrders: 0 }
  };

  paymentDetails.forEach(method => {
    const methodName = method._id?.toLowerCase();

    switch (methodName) {
      case 'bank_transfer':
        // Cek VA numbers untuk menentukan bank
        if (method.va_numbers && method.va_numbers.length > 0) {
          const bank = method.va_numbers[0].bank?.toLowerCase();
          if (bank === 'mandiri') {
            summary.mandiri.totalAmount += method.totalAmount;
            summary.mandiri.totalTransactions += method.totalTransactions;
            summary.mandiri.totalOrders = method.totalOrders;
          } else if (bank === 'bsi' || bank === 'syariah') {
            summary.bsi.totalAmount += method.totalAmount;
            summary.bsi.totalTransactions += method.totalTransactions;
            summary.bsi.totalOrders = method.totalOrders;
          } else if (bank === 'bca') {
            summary.bca.totalAmount += method.totalAmount;
            summary.bca.totalTransactions += method.totalTransactions;
            summary.bca.totalOrders = method.totalOrders;
          } else {
            summary.other.totalAmount += method.totalAmount;
            summary.other.totalTransactions += method.totalTransactions;
            summary.other.totalOrders = method.totalOrders;
          }
        } else if (method.permata_va_number) {
          summary.other.totalAmount += method.totalAmount;
          summary.other.totalTransactions += method.totalTransactions;
          summary.other.totalOrders = method.totalOrders;
        }
        break;

      case 'qris':
        // QRIS sudah dihitung dari breakdown
        summary.qris.totalOrders = method.totalOrders;
        break;

      case 'gopay':
        summary.gopay.totalAmount += method.totalAmount;
        summary.gopay.totalTransactions += method.totalTransactions;
        summary.gopay.totalOrders = method.totalOrders;
        break;

      case 'shopeepay':
        summary.shopeepay.totalAmount += method.totalAmount;
        summary.shopeepay.totalTransactions += method.totalTransactions;
        summary.shopeepay.totalOrders = method.totalOrders;
        break;

      case 'cash':
        summary.cash.totalAmount += method.totalAmount;
        summary.cash.totalTransactions += method.totalTransactions;
        summary.cash.totalOrders = method.totalOrders;
        break;

      case 'card':
      case 'credit_card':
      case 'debit_card':
        summary.card.totalAmount += method.totalAmount;
        summary.card.totalTransactions += method.totalTransactions;
        summary.card.totalOrders = method.totalOrders;
        break;

      default:
        summary.other.totalAmount += method.totalAmount;
        summary.other.totalTransactions += method.totalTransactions;
        summary.other.totalOrders = method.totalOrders;
    }
  });

  return summary;
};

// Controller untuk export report ke Excel/CSV
export const exportSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, outletId, format = 'excel' } = req.query;

    // Generate report data
    const reportResponse = await generateSalesReportData(startDate, endDate, outletId);

    // Format data untuk export
    const exportData = formatExportData(reportResponse);

    if (format === 'csv') {
      return exportCSV(res, exportData, startDate, endDate);
    } else {
      return exportExcel(res, exportData, startDate, endDate);
    }

  } catch (error) {
    console.error('Error exporting sales report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting report'
    });
  }
};

// Helper function untuk generate data report
const generateSalesReportData = async (startDate, endDate, outletId) => {
  // Implementasi sama seperti generateSalesReport tapi return data mentah
  // ... kode yang sama seperti di generateSalesReport ...
};

// Route untuk mendapatkan report detail per payment method
export const getPaymentMethodDetail = async (req, res) => {
  try {
    const { method, startDate, endDate, outletId } = req.query;

    if (!method) {
      return res.status(400).json({
        success: false,
        message: 'Payment method harus diisi'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      createdAt: { $gte: start, $lte: end },
      status: { $in: ['settlement', 'paid'] },
      method: method.toLowerCase()
    };

    if (outletId) {
      matchStage['order.outlet'] = new mongoose.Types.ObjectId(outletId);
    }

    const details = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['settlement', 'paid'] },
          method: method.toLowerCase()
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order_id',
          foreignField: 'order_id',
          as: 'order'
        }
      },
      {
        $unwind: '$order'
      },
      {
        $match: {
          ...(outletId && { 'order.outlet': new mongoose.Types.ObjectId(outletId) }),
          'order.status': { $in: ['Completed', 'OnProcess'] }
        }
      },
      {
        $project: {
          order_id: 1,
          amount: 1,
          transaction_id: 1,
          createdAt: 1,
          paymentType: 1,
          'order.grandTotal': 1,
          'order.user': 1,
          'order.tableNumber': 1,
          'order.orderType': 1,
          raw_response: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        method,
        period: { startDate, endDate },
        totalTransactions: details.length,
        totalAmount: details.reduce((sum, item) => sum + item.amount, 0),
        transactions: details
      }
    });

  } catch (error) {
    console.error('Error getting payment method detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};