import Employee from '../../models/model_hr/Employee.model.js';
import User from '../../models/user.model.js';
import Company from '../../models/model_hr/Company.model.js';

export const employeeController = {
  // Create new employee - UPDATED for multi-company
  createEmployee: async (req, res) => {
    try {
      const {
        userId,
        companyId, // NEW: Add company ID
        employeeId,
        nik,
        npwp = '',
        bpjsKesehatan = '',
        bpjsKetenagakerjaan = '',
        position,
        department,
        joinDate,
        employmentStatus = 'probation',
        employmentType = 'fulltime',
        basicSalary,
        supervisor = null,
        bankAccount = {},
        deductions = {},
        allowances = {}
      } = req.body;

      // Validasi input wajib
      if (!userId || !companyId || !employeeId || !nik || !position || !department || !joinDate || !basicSalary) {
        return res.status(400).json({ 
          success: false,
          message: 'Semua field wajib harus diisi',
          required: ['userId', 'companyId', 'employeeId', 'nik', 'position', 'department', 'joinDate', 'basicSalary']
        });
      }

      // Check if company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Perusahaan tidak ditemukan' 
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false,
          message: 'User tidak ditemukan' 
        });
      }

      // Check if employee already exists for this user in this company
      const existingEmployee = await Employee.findOne({ 
        user: userId,
        company: companyId 
      });
      if (existingEmployee) {
        return res.status(400).json({ 
          success: false,
          message: 'Employee sudah ada untuk user ini di perusahaan ini' 
        });
      }

      // Check if employeeId already exists in this company
      const existingEmployeeId = await Employee.findOne({ 
        company: companyId,
        employeeId 
      });
      if (existingEmployeeId) {
        return res.status(400).json({ 
          success: false,
          message: 'Employee ID sudah digunakan di perusahaan ini' 
        });
      }

      // Check if NIK already exists in this company
      const existingNIK = await Employee.findOne({ 
        company: companyId,
        nik 
      });
      if (existingNIK) {
        return res.status(400).json({ 
          success: false,
          message: 'NIK sudah digunakan di perusahaan ini' 
        });
      }

      // Create employee object
      const employeeData = {
        user: userId,
        company: companyId, // NEW: Add company reference
        employeeId: employeeId.trim(),
        nik: nik.trim(),
        npwp: npwp?.trim() || '',
        bpjsKesehatan: bpjsKesehatan?.trim() || '',
        bpjsKetenagakerjaan: bpjsKetenagakerjaan?.trim() || '',
        position: position.trim(),
        department: department.trim(),
        joinDate: new Date(joinDate),
        employmentStatus,
        employmentType,
        basicSalary: Number(basicSalary),
        supervisor: supervisor || null,
        bankAccount: {
          bankName: bankAccount?.bankName?.trim() || '',
          accountNumber: bankAccount?.accountNumber?.trim() || '',
          accountHolder: bankAccount?.accountHolder?.trim() || user.name || ''
        },
        deductions: {
          bpjsKesehatanEmployee: Number(deductions.bpjsKesehatanEmployee) || 0,
          bpjsKesehatanEmployer: Number(deductions.bpjsKesehatanEmployer) || 0,
          bpjsKetenagakerjaanEmployee: Number(deductions.bpjsKetenagakerjaanEmployee) || 0,
          bpjsKetenagakerjaanEmployer: Number(deductions.bpjsKetenagakerjaanEmployer) || 0,
          tax: Number(deductions.tax) || 0,
          other: Number(deductions.other) || 0
        },
        allowances: {
          departmental: Number(allowances.departmental) || 0,
          childcare: Number(allowances.childcare) || 0,
          transport: Number(allowances.transport) || 0,
          meal: Number(allowances.meal) || 0,
          health: Number(allowances.health) || 0,
          other: Number(allowances.other) || 0
        }
      };

      const employee = new Employee(employeeData);
      await employee.save();
      
      // Populate data setelah save
      const populatedEmployee = await Employee.findById(employee._id)
        .populate('user', 'username email name')
        .populate('company', 'name code')
        .populate('supervisor', 'employeeId position name');

      res.status(201).json({
        success: true,
        message: 'Employee berhasil dibuat',
        data: populatedEmployee
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          success: false,
          message: `${field} sudah digunakan` 
        });
      }
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          success: false,
          message: 'Data validation failed', 
          errors 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all employees - UPDATED for multi-company
  getAllEmployees: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        companyId, // NEW: Filter by company
        department,
        position,
        employmentStatus,
        employmentType,
        isActive = 'true',
        search
      } = req.query;

      const filter = {};

      // Filter by company
      if (companyId) {
        filter.company = companyId;
      }

      // Build other filter objects
      if (department) filter.department = new RegExp(department, 'i');
      if (position) filter.position = new RegExp(position, 'i');
      if (employmentStatus) filter.employmentStatus = employmentStatus;
      if (employmentType) filter.employmentType = employmentType;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      
      // Search across multiple fields
      if (search) {
        filter.$or = [
          { employeeId: { $regex: search, $options: 'i' } },
          { nik: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      const employees = await Employee.find(filter)
        .populate('user', 'username email name')
        .populate('company', 'name code')
        .populate('supervisor', 'employeeId position department name')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Employee.countDocuments(filter);

      res.json({
        success: true,
        data: employees,
        pagination: {
          totalPages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal memuat data employees',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get employees by company - NEW method
  getEmployeesByCompany: async (req, res) => {
    try {
      const { companyId } = req.params;
      const { isActive = 'true' } = req.query;

      const filter = {
        company: companyId
      };

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const employees = await Employee.find(filter)
        .populate('user', 'username email name')
        .populate('supervisor', 'employeeId position department name')
        .sort({ department: 1, position: 1 });

      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      console.error('Error fetching employees by company:', error);
      res.status(500).json({ 
        success: false,
        message: 'Gagal memuat data employees',
        error: error.message 
      });
    }
  },

  // Update employee - UPDATED
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      // Handle nested objects
      if (updateData.bankAccount) {
        updateData.bankAccount = {
          bankName: updateData.bankAccount.bankName || '',
          accountNumber: updateData.bankAccount.accountNumber || '',
          accountHolder: updateData.bankAccount.accountHolder || ''
        };
      }

      if (updateData.allowances) {
        Object.keys(updateData.allowances).forEach(key => {
          updateData.allowances[key] = Number(updateData.allowances[key]) || 0;
        });
      }

      if (updateData.deductions) {
        Object.keys(updateData.deductions).forEach(key => {
          updateData.deductions[key] = Number(updateData.deductions[key]) || 0;
        });
      }

      // Convert string dates to Date objects
      if (updateData.joinDate) {
        updateData.joinDate = new Date(updateData.joinDate);
      }

      const employee = await Employee.findByIdAndUpdate(
        id,
        { $set: updateData },
        { 
          new: true, 
          runValidators: true 
        }
      )
      .populate('user', 'username email name')
      .populate('company', 'name code')
      .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee tidak ditemukan' 
        });
      }

      res.json({
        success: true,
        message: 'Employee berhasil diupdate',
        data: employee
      });
    } catch (error) {
      console.error('Error updating employee:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          success: false,
          message: 'Data validation failed', 
          errors 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Gagal update employee',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get employee by ID - UPDATED
  getEmployeeById: async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id)
        .populate('user', 'username email name')
        .populate('company', 'name code address phone')
        .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error getting employee:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving employee',
        error: error.message 
      });
    }
  },

  // Get employee by user ID - UPDATED
  getEmployeeByUserId: async (req, res) => {
    try {
      const { userId } = req.params;
      const { companyId } = req.query; // Optional: filter by company

      const filter = { user: userId };
      if (companyId) {
        filter.company = companyId;
      }

      const employee = await Employee.findOne(filter)
        .populate('user', 'username email name')
        .populate('company', 'name code')
        .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        data: employee
      });
    } catch (error) {
      console.error('Error getting employee by user ID:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving employee',
        error: error.message 
      });
    }
  },

  // Deactivate employee
  deactivateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const { resignationDate, resignationReason } = req.body;

      const employee = await Employee.findByIdAndUpdate(
        id,
        {
          isActive: false,
          resignationDate: resignationDate ? new Date(resignationDate) : new Date(),
          resignationReason: resignationReason || ''
        },
        { new: true }
      )
      .populate('user', 'username email name')
      .populate('company', 'name code')
      .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        message: 'Employee deactivated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error deactivating employee:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deactivating employee', 
        error: error.message 
      });
    }
  },

  // Reactivate employee
  reactivateEmployee: async (req, res) => {
    try {
      const { id } = req.params;

      const employee = await Employee.findByIdAndUpdate(
        id,
        {
          isActive: true,
          resignationDate: null,
          resignationReason: null
        },
        { new: true }
      )
      .populate('user', 'username email name')
      .populate('company', 'name code')
      .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        message: 'Employee reactivated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error reactivating employee:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error reactivating employee', 
        error: error.message 
      });
    }
  },

  // Get employees by department - UPDATED
  getEmployeesByDepartment: async (req, res) => {
    try {
      const { companyId, department } = req.params;
      const { isActive = true } = req.query;

      const employees = await Employee.find({ 
        company: companyId,
        department,
        isActive: isActive === 'true'
      })
      .populate('user', 'username email name')
      .populate('supervisor', 'employeeId position department name')
      .sort({ position: 1 });

      res.json({
        success: true,
        data: employees,
        total: employees.length
      });
    } catch (error) {
      console.error('Error getting employees by department:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving employees', 
        error: error.message 
      });
    }
  },

  updateEmployeeDeductions: async (req, res) => {
    try {
      const { id } = req.params;
      const deductions = req.body;

      const employee = await Employee.findByIdAndUpdate(
        id,
        { deductions },
        { new: true, runValidators: true }
      )
      .populate('user', 'username email name')
      .populate('company', 'name code')
      .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        message: 'Employee deductions updated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error updating employee deductions:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating employee deductions', 
        error: error.message 
      });
    }
  },

  // Update employee allowances
  updateEmployeeAllowances: async (req, res) => {
    try {
      const { id } = req.params;
      const allowances = req.body;

      const employee = await Employee.findByIdAndUpdate(
        id,
        { allowances },
        { new: true, runValidators: true }
      )
      .populate('user', 'username email name')
      .populate('company', 'name code')
      .populate('supervisor', 'employeeId position department name');

      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      res.json({
        success: true,
        message: 'Employee allowances updated successfully',
        data: employee
      });
    } catch (error) {
      console.error('Error updating employee allowances:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating employee allowances', 
        error: error.message 
      });
    }
  },

  // Calculate total salary components
  getSalarySummary: async (req, res) => {
    try {
      const { id } = req.params;

      const employee = await Employee.findById(id)
        .populate('user', 'username email name')
        .populate('company', 'name code');
      
      if (!employee) {
        return res.status(404).json({ 
          success: false,
          message: 'Employee not found' 
        });
      }

      // Calculate total allowances
      const totalAllowances = Object.values(employee.allowances).reduce((sum, amount) => sum + amount, 0);

      // Calculate total deductions
      const totalDeductions = Object.values(employee.deductions).reduce((sum, amount) => sum + amount, 0);

      // Calculate net salary
      const netSalary = employee.basicSalary + totalAllowances - totalDeductions;

      const salarySummary = {
        basicSalary: employee.basicSalary,
        totalAllowances,
        totalDeductions,
        netSalary,
        allowances: employee.allowances,
        deductions: employee.deductions,
        employee: {
          employeeId: employee.employeeId,
          name: employee.user?.name || 'Unknown',
          position: employee.position,
          department: employee.department
        }
      };

      res.json({
        success: true,
        data: salarySummary
      });
    } catch (error) {
      console.error('Error getting salary summary:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving salary summary', 
        error: error.message 
      });
    }
  },


  // Get supervisors list - UPDATED
  getSupervisors: async (req, res) => {
    try {
      const { companyId } = req.params;
      
      const supervisors = await Employee.find({
        company: companyId,
        isActive: true,
        $or: [
          { position: { $regex: 'manager', $options: 'i' } },
          { position: { $regex: 'supervisor', $options: 'i' } },
          { position: { $regex: 'head', $options: 'i' } },
          { position: { $regex: 'lead', $options: 'i' } }
        ]
      })
      .populate('user', 'username email name')
      .select('employeeId position department company user')
      .sort({ position: 1 });

      res.json({
        success: true,
        data: supervisors
      });
    } catch (error) {
      console.error('Error getting supervisors:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving supervisors', 
        error: error.message 
      });
    }
  }
};