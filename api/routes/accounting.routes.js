import express from 'express';
import { accountingController } from '../controllers/accounting.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);
// Laporan Harian
router.get(
  '/daily-report',
  accountingController.getDailyReport
);

// Laporan Laba Rugi (Periodik)
router.get(
  '/profit-loss',
  accountingController.getProfitLossReport
);

// Neraca Keuangan
router.get(
  '/balance-sheet',
  accountingController.getBalanceSheet
);

// Laporan Arus Kas
router.get(
  '/cash-flow',
  accountingController.getCashFlowReport
);

// Ringkasan Keuangan
router.get(
  '/summary',
  accountingController.getFinancialSummary
);

export default router;