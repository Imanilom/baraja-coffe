import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { employeeController } from '../controllers/hr/employee.controller.js';
import { attendanceController } from '../controllers/hr/attendance.controller.js';

import { fingerprintController } from '../controllers/hr/fingerprint.controller.js';


const router = express.Router();

// Middleware for admin and superadmin only
const adminAccess = verifyToken(['admin', 'superadmin']);

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

// Register fingerprint
router.post('/fingerprints/register', fingerprintController.registerFingerprint);

// Get fingerprints by employee
router.get('/fingerprints/employee/:employeeId', fingerprintController.getFingerprintsByEmployee);

// Get fingerprint by device user ID
router.get('/fingerprints/device-user/:deviceUserId', fingerprintController.getFingerprintByDeviceUserId);

// Verify fingerprint
router.post('/fingerprints/verify', fingerprintController.verifyFingerprint);

// Update device user ID
router.put('/fingerprints/:id/device-user', fingerprintController.updateDeviceUserId);

// Sync with device
router.post('/fingerprints/sync', fingerprintController.syncWithDevice);

// Bulk sync with device
router.post('/fingerprints/bulk-sync', fingerprintController.bulkSyncWithDevice);

// Get all device users
router.get('/fingerprints/device-users', fingerprintController.getAllDeviceUsers);

// Delete fingerprint
router.delete('/fingerprints/:id', fingerprintController.deleteFingerprint);

// Deactivate fingerprint
router.patch('/fingerprints/:id/deactivate', fingerprintController.deactivateFingerprint);

export default router;



