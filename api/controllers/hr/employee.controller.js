import Employee from '../../models/model_hr/Employee.model.js';
import User from '../../models/user.model.js';

export const employeeController = {
  // Create new employee
  createEmployee: async (req, res) => {
    try {
      const {
        userId,
        employeeId,
        nik,
        npwp,
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        position,
        department,
        joinDate,
        employmentStatus,
        employmentType,
        basicSalary,
        bankAccount,
        supervisor,
        // New fields for deductions and allowances
        deductions = {},
        allowances = {}
      } = req.body;

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if employee already exists for this user
      const existingEmployee = await Employee.findOne({ user: userId });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee already exists for this user' });
      }

      // Check if employeeId or NIK already exists
      const existingEmployeeId = await Employee.findOne({ employeeId });
      if (existingEmployeeId) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }

      const existingNIK = await Employee.findOne({ nik });
      if (existingNIK) {
        return res.status(400).json({ message: 'NIK already exists' });
      }

      const employee = new Employee({
        user: userId,
        employeeId,
        nik,
        npwp,
        bpjsKesehatan,
        bpjsKetenagakerjaan,
        position,
        department,
        joinDate,
        employmentStatus,
        employmentType,
        basicSalary,
        bankAccount,
        supervisor,
        // Include new fields
        deductions: {
          bpjsKesehatanEmployee: deductions.bpjsKesehatanEmployee || 0,
          bpjsKesehatanEmployer: deductions.bpjsKesehatanEmployer || 0,
          bpjsKetenagakerjaanEmployee: deductions.bpjsKetenagakerjaanEmployee || 0,
          bpjsKetenagakerjaanEmployer: deductions.bpjsKetenagakerjaanEmployer || 0,
          tax: deductions.tax || 0,
          other: deductions.other || 0
        },
        allowances: {
          childcare: allowances.childcare || 0,
          departmental: allowances.departmental || 0,
          housing: allowances.housing || 0,
          transport: allowances.transport || 0,
          meal: allowances.meal || 0,
          health: allowances.health || 0,
          other: allowances.other || 0
        }
      });

      await employee.save();
      
      // Populate user data
      await employee.populate('user supervisor');

      res.status(201).json({
        message: 'Employee created successfully',
        data: employee
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all employees
  getAllEmployees: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        department,
        position,
        employmentStatus,
        employmentType,
        isActive,
        search
      } = req.query;

      const filter = {};

      if (department) filter.department = department;
      if (position) filter.position = position;
      if (employmentStatus) filter.employmentStatus = employmentStatus;
      if (employmentType) filter.employmentType = employmentType;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      
      if (search) {
        filter.$or = [
          { employeeId: { $regex: search, $options: 'i' } },
          { nik: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      const employees = await Employee.find(filter)
        .populate('user supervisor')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Employee.countDocuments(filter);

      res.json({
        data: employees,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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

  // Update employee
  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle nested objects for deductions and allowances
      if (updateData.deductions) {
        updateData.$set = updateData.$set || {};
        updateData.$set.deductions = updateData.deductions;
        delete updateData.deductions;
      }

      if (updateData.allowances) {
        updateData.$set = updateData.$set || {};
        updateData.$set.allowances = updateData.allowances;
        delete updateData.allowances;
      }

      const employee = await Employee.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('user supervisor');

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      res.json({
        message: 'Employee updated successfully',
        data: employee
      });
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