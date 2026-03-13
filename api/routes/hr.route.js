import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { CompanyController } from '../controllers/hr/company.controller.js';
import { employeeController } from '../controllers/hr/employee.controller.js';
import { attendanceController } from '../controllers/hr/attendance.controller.js';
import { SalaryController } from '../controllers/hr/salary.controller.js';
import { fingerprintController } from '../controllers/hr/fingerprint.controller.js';
import { HRSettingsController } from '../controllers/hr/hrsetting.controller.js';
import { setCompanyContext, requireCompany } from '../utils/companyMiddleware.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin', 'hr']);

// ==================== COMPANY ROUTES ====================
// Get all companies (admin/superadmin only)
router.get('/companies', adminAccess, CompanyController.getAllCompanies);

// Get company by ID
router.get('/companies/:id', adminAccess, CompanyController.getCompanyById);

// Create new company (superadmin only)
router.post('/companies', verifyToken(['admin', 'superadmin']), CompanyController.createCompany);

// Update company (admin/superadmin only)
router.put('/companies/:id', adminAccess, CompanyController.updateCompany);

// Deactivate company
router.patch('/companies/:id/deactivate', adminAccess, CompanyController.deactivateCompany);

// Activate company
router.patch('/companies/:id/activate', adminAccess, CompanyController.activateCompany);

// Get company settings
router.get('/companies/:id/settings', adminAccess, CompanyController.getCompanySettings);

// Update company settings
router.put('/companies/:id/settings', adminAccess, CompanyController.updateCompanySettings);

// ==================== EMPLOYEE ROUTES ====================
// Apply company context middleware for employee routes
router.use('/employees', setCompanyContext);

// Create new employee - NOW REQUIRES companyId in body
router.post('/employees', adminAccess, employeeController.createEmployee);

// Get all employees with filtering and pagination
router.get('/employees', adminAccess, employeeController.getAllEmployees);

// Get employees by specific company
router.get('/employees/company/:companyId', adminAccess, employeeController.getEmployeesByCompany);

// Get employee by ID
router.get('/employees/:id', adminAccess, employeeController.getEmployeeById);

// Get employee by user ID (with optional company filter)
router.get('/employees/user/:userId', adminAccess, employeeController.getEmployeeByUserId);

// Get employees by department in a company
router.get('/employees/:companyId/department/:department', adminAccess, employeeController.getEmployeesByDepartment);

// Get supervisors list for a company
router.get('/employees/supervisors/:companyId', adminAccess, employeeController.getSupervisors);

// Update employee
router.put('/employees/:id', adminAccess, employeeController.updateEmployee);

// Update employee deductions
router.patch('/employees/:id/deductions', adminAccess, employeeController.updateEmployeeDeductions);

// Update employee allowances
router.patch('/employees/:id/allowances', adminAccess, employeeController.updateEmployeeAllowances);

// Get salary summary
router.get('/employees/:id/salary-summary', adminAccess, employeeController.getSalarySummary);

// Deactivate employee
router.patch('/employees/:id/deactivate', adminAccess, employeeController.deactivateEmployee);

// Reactivate employee
router.patch('/employees/:id/reactivate', adminAccess, employeeController.reactivateEmployee);

// ==================== ATTENDANCE ROUTES ====================
// Apply company context for attendance routes
router.use('/attendance', setCompanyContext);

// Get attendance by employee and date range
router.get('/attendance/employee/:employeeId', adminAccess, attendanceController.getAttendanceByEmployee);

// Get attendance summary for dashboard (requires company context)
router.get('/attendance/summary', adminAccess, requireCompany, attendanceController.getAttendanceSummary);

// Manual attendance correction
router.put('/attendance/:id', adminAccess, attendanceController.updateAttendance);

// ==================== SALARY ROUTES ====================
// Apply company context for salary routes
router.use('/salaries', setCompanyContext, requireCompany);

// Calculate salary for specific employee
router.post('/salaries/calculate', adminAccess, SalaryController.calculateSalary);

// Calculate salary for all employees in period for a company
router.post('/salaries/calculate-all', adminAccess, SalaryController.calculateSalaryForAll);

// Get salary by employee with pagination
router.get('/salaries/employee/:employeeId', adminAccess, SalaryController.getSalaryByEmployee);

// Get salary by period (month and year) - requires companyId in query
router.get('/salaries/period', adminAccess, SalaryController.getSalaryByPeriod);

// Get salary summary for period - requires companyId in query
router.get('/salaries/summary', adminAccess, SalaryController.getSalarySummary);

// Approve salary
router.patch('/salaries/:id/approve', adminAccess, SalaryController.approveSalary);

// Mark salary as paid
router.patch('/salaries/:id/mark-paid', adminAccess, SalaryController.markAsPaid);

// Update salary manually
router.put('/salaries/:id', adminAccess, SalaryController.updateSalary);

// Delete salary calculation
router.delete('/salaries/:id', adminAccess, SalaryController.deleteSalary);

// ==================== HR SETTINGS ROUTES ====================
// Apply company context for settings routes
router.use('/settings', setCompanyContext);

// Get HR settings for a company
router.get('/settings', adminAccess, requireCompany, HRSettingsController.getSettings);

// Save/update HR settings for a company
router.post('/settings', adminAccess, requireCompany, HRSettingsController.saveSettings);

// Get specific section of HR settings
router.get('/settings/section/:section', adminAccess, requireCompany, HRSettingsController.getSection);

// Update specific section of HR settings for a company
router.patch('/settings/section/:section', adminAccess, requireCompany, HRSettingsController.updateSection);

// Reset HR settings to company defaults
router.post('/settings/:companyId/reset', adminAccess, HRSettingsController.resetSettings);

// BPJS calculation preview - requires companyId
router.get('/settings/preview/bpjs', adminAccess, requireCompany, HRSettingsController.getBpjsPreview);

// Overtime calculation preview
router.get('/settings/preview/overtime', adminAccess, HRSettingsController.getOvertimePreview);

// Validate settings for a company
router.get('/settings/validate', adminAccess, requireCompany, HRSettingsController.validateSettings);

// ==================== FINGERPRINT ROUTES ====================
// Apply company context for fingerprint routes
router.use('/fingerprints', setCompanyContext, requireCompany);

// Register fingerprint (requires employee to have company)
router.post('/fingerprints/register', adminAccess, fingerprintController.registerFingerprint);

// Get fingerprints by employee
router.get('/fingerprints/employee/:employeeId', adminAccess, fingerprintController.getFingerprintsByEmployee);

// Get fingerprint by device user ID
router.get('/fingerprints/device-user/:deviceUserId', adminAccess, fingerprintController.getFingerprintByDeviceUserId);

// Verify fingerprint
router.post('/fingerprints/verify', adminAccess, fingerprintController.verifyFingerprint);

// Update device user ID
router.put('/fingerprints/:id/device-user', adminAccess, fingerprintController.updateDeviceUserId);

// Sync with device
router.post('/fingerprints/sync', adminAccess, fingerprintController.syncWithDevice);

// Bulk sync with device
router.post('/fingerprints/bulk-sync', adminAccess, fingerprintController.bulkSyncWithDevice);

// Get all device users for current company
router.get('/fingerprints/device-users', adminAccess, fingerprintController.getAllDeviceUsers);

// Delete fingerprint
router.delete('/fingerprints/:id', adminAccess, fingerprintController.deleteFingerprint);

// Deactivate fingerprint
router.patch('/fingerprints/:id/deactivate', adminAccess, fingerprintController.deactivateFingerprint);

// Reactivate fingerprint
router.patch('/fingerprints/:id/reactivate', adminAccess, fingerprintController.reactivateFingerprint);

// Device User ID based operations
router.patch('/fingerprints/device-user/:deviceUserId/deactivate', adminAccess, fingerprintController.deactivateFingerprintByDeviceUser);
router.patch('/fingerprints/device-user/:deviceUserId/reactivate', adminAccess, fingerprintController.reactivateFingerprintByDeviceUser);

// Raw fingerprint mapping routes
router.post('/fingerprints/map-raw', adminAccess, fingerprintController.mapRawFingerprint);
router.post('/fingerprints/auto-map', adminAccess, fingerprintController.autoMapFingerprint);
router.post('/fingerprints/bulk-auto-map', adminAccess, fingerprintController.bulkAutoMapFingerprints);
router.get('/fingerprints/unmapped-raw', adminAccess, fingerprintController.getUnmappedFingerprintsWithActivity);
router.get('/fingerprints/with-employee', adminAccess, fingerprintController.getAllFingerprintsWithEmployee);

export default router;