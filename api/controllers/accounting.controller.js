import { Order } from "../models/order.model.js";
import Cashflow from '../models/modul_market/CashFlow.model.js';
import Debt from '../models/modul_market/Debt.model.js';
import MarketList from '../models/modul_market/MarketList.model.js';
import mongoose from 'mongoose';

export const accountingController = {
  // Laporan Harian
  async getDailyReport(req, res) {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // 1. Pendapatan dari Order
      const orders = await Order.find({
        createdAt: { $gte: targetDate, $lt: nextDay },
        status: 'Completed'
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

      // 2. Pengeluaran dari MarketList dan Cashflow
      const marketLists = await MarketList.find({
        date: { $gte: targetDate, $lt: nextDay }
      });

      const totalExpenses = marketLists.reduce((sum, list) => {
        const itemsExpense = list.items.reduce((itemSum, item) => itemSum + item.amountPaid, 0);
        const additionalExpense = list.additionalExpenses.reduce((addSum, exp) => addSum + exp.amount, 0);
        return sum + itemsExpense + additionalExpense;
      }, 0);

      // 3. Cashflow
      const cashflows = await Cashflow.find({
        date: { $gte: targetDate, $lt: nextDay }
      });

      const totalCashIn = cashflows.reduce((sum, cf) => sum + cf.cashIn, 0);
      const totalCashOut = cashflows.reduce((sum, cf) => sum + cf.cashOut, 0);

      // 4. Hutang Piutang
      const debts = await Debt.find({
        date: { $gte: targetDate, $lt: nextDay }
      });

      const totalDebts = debts.reduce((sum, debt) => sum + (debt.amount - debt.paidAmount), 0);

      // Laba Rugi Harian
      const dailyProfit = totalRevenue - totalExpenses;

      res.json({
        date: targetDate.toISOString().split('T')[0],
        revenue: {
          total: totalRevenue,
          orders: orders.length,
          breakdown: orders.map(order => ({
            orderId: order.order_id,
            amount: order.grandTotal,
            paymentMethod: order.paymentMethod
          }))
        },
        expenses: {
          total: totalExpenses,
          marketLists: marketLists.length,
          cashOut: totalCashOut,
          breakdown: marketLists.map(list => ({
            marketListId: list._id,
            amount: list.items.reduce((sum, item) => sum + item.amountPaid, 0),
            additionalExpenses: list.additionalExpenses.length
          }))
        },
        cashflow: {
          cashIn: totalCashIn,
          cashOut: totalCashOut,
          netCashflow: totalCashIn - totalCashOut
        },
        debts: {
          total: totalDebts,
          count: debts.length
        },
        profit: dailyProfit
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Laporan Laba Rugi (Periodik)
  async getProfitLossReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      // 1. Pendapatan
      const orders = await Order.find({
        createdAt: { $gte: start, $lte: end },
        status: 'Completed'
      });

      const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

      // 2. Harga Pokok Penjualan (HPP)
      const marketLists = await MarketList.find({
        date: { $gte: start, $lte: end }
      });

      const totalCOGS = marketLists.reduce((sum, list) => {
        const itemsExpense = list.items.reduce((itemSum, item) => itemSum + item.amountPaid, 0);
        const additionalExpense = list.additionalExpenses.reduce((addSum, exp) => addSum + exp.amount, 0);
        return sum + itemsExpense + additionalExpense;
      }, 0);

      // 3. Beban Operasional (dari Cashflow)
      const cashflows = await Cashflow.find({
        date: { $gte: start, $lte: end },
        cashOut: { $gt: 0 }
      });

      const operatingExpenses = cashflows.reduce((sum, cf) => sum + cf.cashOut, 0);

      // 4. Laba Kotor dan Laba Bersih
      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - operatingExpenses;

      res.json({
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        revenue: {
          total: totalRevenue,
          orders: orders.length,
          averagePerOrder: orders.length > 0 ? totalRevenue / orders.length : 0
        },
        costOfGoodsSold: {
          total: totalCOGS,
          percentage: totalRevenue > 0 ? (totalCOGS / totalRevenue) * 100 : 0
        },
        grossProfit: {
          amount: grossProfit,
          percentage: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
        },
        operatingExpenses: {
          total: operatingExpenses,
          percentage: totalRevenue > 0 ? (operatingExpenses / totalRevenue) * 100 : 0
        },
        netProfit: {
          amount: netProfit,
          percentage: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
        }
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Neraca
  async getBalanceSheet(req, res) {
    try {
      // Aset
      const cashflows = await Cashflow.find().sort({ date: -1 }).limit(1);
      const currentCashBalance = cashflows.length > 0 ? cashflows[0].balance : 0;

      const unpaidDebts = await Debt.find({ status: { $in: ['unpaid', 'partial'] } });
      const totalReceivables = unpaidDebts.reduce((sum, debt) => sum + (debt.amount - debt.paidAmount), 0);

      // Kewajiban
      const unpaidMarketLists = await MarketList.aggregate([
        { $unwind: "$items" },
        { $match: { "items.remainingBalance": { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$items.remainingBalance" } } }
      ]);
      const totalPayables = unpaidMarketLists.length > 0 ? unpaidMarketLists[0].total : 0;

      // Ekuitas
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthlyProfit = await accountingController.calculateMonthlyProfit(startOfMonth, endOfMonth);


      res.json({
        date: new Date().toISOString().split('T')[0],
        assets: {
          current: {
            cash: currentCashBalance,
            receivables: totalReceivables,
            totalCurrentAssets: currentCashBalance + totalReceivables
          },
          fixed: {
            // Tambahkan aset tetap jika ada
            equipment: 0,
            furniture: 0,
            totalFixedAssets: 0
          },
          totalAssets: currentCashBalance + totalReceivables
        },
        liabilities: {
          current: {
            payables: totalPayables,
            shortTermLoans: 0,
            totalCurrentLiabilities: totalPayables
          },
          longTerm: {
            loans: 0,
            totalLongTermLiabilities: 0
          },
          totalLiabilities: totalPayables
        },
        equity: {
          retainedEarnings: monthlyProfit,
          totalEquity: monthlyProfit
        },
        balanceCheck: (currentCashBalance + totalReceivables) === (totalPayables + monthlyProfit)
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Bantu hitung laba bulanan
  async calculateMonthlyProfit(startDate, endDate) {
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Completed'
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);

    const marketLists = await MarketList.find({
      date: { $gte: startDate, $lte: endDate }
    });
    const totalCOGS = marketLists.reduce((sum, list) => {
      const itemsExpense = list.items.reduce((itemSum, item) => itemSum + item.amountPaid, 0);
      const additionalExpense = list.additionalExpenses.reduce((addSum, exp) => addSum + exp.amount, 0);
      return sum + itemsExpense + additionalExpense;
    }, 0);

    const cashflows = await Cashflow.find({
      date: { $gte: startDate, $lte: endDate },
      cashOut: { $gt: 0 }
    });
    const operatingExpenses = cashflows.reduce((sum, cf) => sum + cf.cashOut, 0);

    return totalRevenue - totalCOGS - operatingExpenses;
  },

  // Arus Kas
  async getCashFlowReport(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      const cashflows = await Cashflow.find({
        date: { $gte: start, $lte: end }
      }).sort({ date: 1 });

      const openingBalance = await Cashflow.findOne({ date: { $lt: start } }).sort({ date: -1 });
      const closingBalance = await Cashflow.findOne({ date: { $lte: end } }).sort({ date: -1 });

      res.json({
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        openingBalance: openingBalance ? openingBalance.balance : 0,
        closingBalance: closingBalance ? closingBalance.balance : 0,
        cashIn: {
          total: cashflows.reduce((sum, cf) => sum + cf.cashIn, 0),
          transactions: cashflows.filter(cf => cf.cashIn > 0).map(cf => ({
            date: cf.date,
            amount: cf.cashIn,
            description: cf.description,
            source: cf.source
          }))
        },
        cashOut: {
          total: cashflows.reduce((sum, cf) => sum + cf.cashOut, 0),
          transactions: cashflows.filter(cf => cf.cashOut > 0).map(cf => ({
            date: cf.date,
            amount: cf.cashOut,
            description: cf.description,
            destination: cf.destination
          }))
        },
        netCashFlow: cashflows.reduce((sum, cf) => sum + (cf.cashIn - cf.cashOut), 0)
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Ringkasan Keuangan
  async getFinancialSummary(req, res) {
    try {
      // Hari Ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayOrders = await Order.find({
        createdAt: { $gte: today, $lt: tomorrow },
        status: 'Completed'
      });
      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.grandTotal, 0);

      // Bulan Ini
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthlyProfit = await accountingController.calculateMonthlyProfit(startOfMonth, endOfMonth);

      // Hutang Piutang
      const totalReceivables = await Debt.aggregate([
        { $match: { status: { $in: ['unpaid', 'partial'] } },
        },
        { $group: { _id: null, total: { $sum: { $subtract: ["$amount", "$paidAmount"] } } } }
      ]);

      const totalPayables = await MarketList.aggregate([
        { $unwind: "$items" },
        { $match: { "items.remainingBalance": { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$items.remainingBalance" } } }
      ]);

      // Saldo Kas
      const lastCashflow = await Cashflow.findOne().sort({ date: -1 });

      res.json({
        today: {
          revenue: todayRevenue,
          orders: todayOrders.length,
          averageOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0
        },
        thisMonth: {
          profit: monthlyProfit
        },
        receivables: totalReceivables.length > 0 ? totalReceivables[0].total : 0,
        payables: totalPayables.length > 0 ? totalPayables[0].total : 0,
        cashBalance: lastCashflow ? lastCashflow.balance : 0
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};