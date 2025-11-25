import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { employeeController } from '../controllers/hr/employee.controller.js';
import { attendanceController } from '../controllers/hr/attendance.controller.js';
import { SalaryController } from '../controllers/hr/salary.controller.js';
import { fingerprintController } from '../controllers/hr/fingerprint.controller.js';

const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin', 'hr']);

// HR Routes
// Create new employee
router.post('/employees', employeeController.createEmployee);

// Get all employees with filtering and pagination
router.get('/employees', employeeController.getAllEmployees);

// Get employee by ID
router.get('/employees/:id', employeeController.getEmployeeById);

// Get employee by user ID
router.get('/employees/user/:userId', employeeController.getEmployeeByUserId);

// Get employees by department
router.get('/employees/department/:department', employeeController.getEmployeesByDepartment);

// Get supervisors list
router.get('/employees/supervisors/list', employeeController.getSupervisors);

// Update employee
router.put('/employees/:id', employeeController.updateEmployee);

// Update employee deductions
router.patch('/employees/:id/deductions', employeeController.updateEmployeeDeductions);

// Update employee allowances
router.patch('/employees/:id/allowances', employeeController.updateEmployeeAllowances);

// Get salary summary
router.get('/employees/:id/salary-summary', employeeController.getSalarySummary);

// Deactivate employee
router.patch('/employees/:id/deactivate', employeeController.deactivateEmployee);

// Reactivate employee
router.patch('/employees/:id/reactivate', employeeController.reactivateEmployee);

// Get attendance by employee and date range
router.get('/attendance/employee/:employeeId', attendanceController.getAttendanceByEmployee);

// Get attendance summary for dashboard
router.get('/attendance/summary', attendanceController.getAttendanceSummary);

// Manual attendance correction
router.put('/attendance/:id', attendanceController.updateAttendance);

// ==================== SALARY ROUTES ====================

// Calculate salary for specific employee
router.post('/salaries/calculate', adminAccess, SalaryController.calculateSalary);

// Calculate salary for all employees in period
router.post('/salaries/calculate-all', adminAccess, SalaryController.calculateSalaryForAll);

// Get salary by employee with pagination
router.get('/salaries/employee/:employeeId', adminAccess, SalaryController.getSalaryByEmployee);

// Get salary by period (month and year)
router.get('/salaries/period', adminAccess, SalaryController.getSalaryByPeriod);

// Get salary summary for period
router.get('/salaries/summary', adminAccess, SalaryController.getSalarySummary);

// Approve salary
router.patch('/salaries/:id/approve', adminAccess, SalaryController.approveSalary);

// Mark salary as paid
router.patch('/salaries/:id/mark-paid', adminAccess, SalaryController.markAsPaid);

// Update salary manually
router.put('/salaries/:id', adminAccess, SalaryController.updateSalary);

// Delete salary calculation
router.delete('/salaries/:id', adminAccess, SalaryController.deleteSalary);

// ==================== FINGERPRINT ROUTES ====================

// Fingerprint Routes
router.post('/fingerprints/register', fingerprintController.registerFingerprint);
router.get('/fingerprints/employee/:employeeId', fingerprintController.getFingerprintsByEmployee);
router.get('/fingerprints/device-user/:deviceUserId', fingerprintController.getFingerprintByDeviceUserId);
router.post('/fingerprints/verify', fingerprintController.verifyFingerprint);
router.put('/fingerprints/:id/device-user', fingerprintController.updateDeviceUserId);
router.post('/fingerprints/sync', fingerprintController.syncWithDevice);
router.post('/fingerprints/bulk-sync', fingerprintController.bulkSyncWithDevice);
router.get('/fingerprints/device-users', fingerprintController.getAllDeviceUsers);
router.delete('/fingerprints/:id', fingerprintController.deleteFingerprint);
router.patch('/fingerprints/:id/deactivate', fingerprintController.deactivateFingerprint);
router.patch('/fingerprints/:id/reactivate', fingerprintController.reactivateFingerprint);

// Device User ID based operations
router.patch('/fingerprints/device-user/:deviceUserId/deactivate', fingerprintController.deactivateFingerprintByDeviceUser);
router.patch('/fingerprints/device-user/:deviceUserId/reactivate', fingerprintController.reactivateFingerprintByDeviceUser);

// Raw fingerprint mapping routes
router.post('/fingerprints/map-raw', fingerprintController.mapRawFingerprint);
router.post('/fingerprints/auto-map', fingerprintController.autoMapFingerprint);
router.post('/fingerprints/bulk-auto-map', fingerprintController.bulkAutoMapFingerprints);
router.get('/fingerprints/unmapped-raw', fingerprintController.getUnmappedFingerprintsWithActivity);
router.get('/fingerprints/with-employee', fingerprintController.getAllFingerprintsWithEmployee);

export default router;