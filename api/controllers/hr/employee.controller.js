import Employee from '../../models/model_hr/Employee.model.js';
import User from '../../models/user.model.js';

export const employeeController = {
  // Create new employee - FIXED
  createEmployee: async (req, res) => {
    try {
      const {
        userId, // menerima userId dari frontend
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

      console.log('Received data:', req.body); // Debug log

      // Validasi input wajib
      if (!userId || !employeeId || !nik || !position || !department || !joinDate || !basicSalary) {
        return res.status(400).json({ 
          message: 'Semua field wajib harus diisi',
          required: ['userId', 'employeeId', 'nik', 'position', 'department', 'joinDate', 'basicSalary']
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      // Check if employee already exists for this user
      const existingEmployee = await Employee.findOne({ user: userId });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee sudah ada untuk user ini' });
      }

      // Check if employeeId or NIK already exists
      const existingEmployeeId = await Employee.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'Employee ID sudah digunakan' });
      }

      const existingNIK = await Employee.findOne({ nik });
      if (existingNIK) {
        return res.status(400).json({ message: 'NIK sudah digunakan' });
      }

      // Create employee object dengan data yang sudah divalidasi
      const employeeData = {
        user: userId,
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
          accountHolder: bankAccount?.accountHolder?.trim() || ''
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
        .populate('user', 'username email')
        .populate('supervisor', 'employeeId position');

      res.status(201).json({
        success: true,
        message: 'Employee berhasil dibuat',
        data: populatedEmployee
      });
    } catch (error) {
      console.error('Error creating employee:', error);
      
      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          message: `${field} sudah digunakan` 
        });
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Data validation failed', 
          errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all employees - FIXED
  getAllEmployees: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        department,
        position,
        employmentStatus,
        employmentType,
        isActive = 'true',
        search
      } = req.query;

      const filter = {};

      // Build filter object
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

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: [
          { path: 'user', select: 'username email' },
          { path: 'supervisor', select: 'employeeId position department' }
        ]
      };

      const employees = await Employee.find(filter)
        .populate('user', 'username email')
        .populate('supervisor', 'employeeId position department')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Employee.countDocuments(filter);

      res.json({
        success: true,
        data: employees,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total,
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ 
        message: 'Gagal memuat data employees',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Update employee - FIXED
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
      .populate('user', 'username email')
      .populate('supervisor', 'employeeId position department');

      if (!employee) {
        return res.status(404).json({ message: 'Employee tidak ditemukan' });
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
          message: 'Data validation failed', 
          errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Gagal update employee',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get employee by ID
  getEmployeeById: async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id)
        .populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get employee by user ID
  getEmployeeByUserId: async (req, res) => {
    try {
      const employee = await Employee.findOne({ user: req.params.userId })
        .populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update employee deductions
  updateEmployeeDeductions: async (req, res) => {
    try {
      const { id } = req.params;
      const deductions = req.body;

      const employee = await Employee.findByIdAndUpdate(
        id,
        { deductions },
        { new: true, runValidators: true }
      ).populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee deductions updated successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
      ).populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee allowances updated successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Calculate total salary components
  getSalarySummary: async (req, res) => {
    try {
      const { id } = req.params;

      const employee = await Employee.findById(id);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
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
        deductions: employee.deductions
      };

      res.json(salarySummary);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
          resignationDate,
          resignationReason
        },
        { new: true }
      ).populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee deactivated successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
      ).populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee reactivated successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get employees by department
  getEmployeesByDepartment: async (req, res) => {
    try {
      const { department } = req.params;
      const { isActive = true } = req.query;

      const employees = await Employee.find({ 
        department,
        isActive: isActive === 'true'
      })
      .populate('user supervisor')
      .sort({ position: 1 });

      res.json({
        department,
        total: employees.length,
        data: employees
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get supervisors list
  getSupervisors: async (req, res) => {
    try {
      const supervisors = await Employee.find({
        isActive: true,
        $or: [
          { position: { $regex: 'manager', $options: 'i' } },
          { position: { $regex: 'supervisor', $options: 'i' } },
          { position: { $regex: 'head', $options: 'i' } },
          { position: { $regex: 'lead', $options: 'i' } }
        ]
      })
      .populate('user')
      .select('employeeId position department user')
      .sort({ position: 1 });

      res.json(supervisors);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};