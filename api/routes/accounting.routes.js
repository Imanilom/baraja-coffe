import express from 'express';
import { accountingController } from '../controllers/accounting.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Hanya superadmin, admin, accounting yang boleh akses
const accountingaccess = verifyToken(['superadmin', 'admin', 'accounting']);

// Laporan Harian
router.get(
  '/daily-report',
  accountingaccess,
  accountingController.getDailyReport
);

// Laporan Laba Rugi (Periodik)
router.get(
  '/profit-loss',
  accountingaccess,
  accountingController.getProfitLossReport
);

// Neraca Keuangan
router.get(
  '/balance-sheet',
  accountingaccess,
  accountingController.getBalanceSheet
);

// Laporan Arus Kas
router.get(
  '/cash-flow',
  accountingaccess,
  accountingController.getCashFlowReport
);

// Ringkasan Keuangan
router.get(
  '/summary',
  accountingaccess,
  accountingController.getFinancialSummary
);

export default router;
