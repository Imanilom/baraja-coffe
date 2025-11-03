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
        supervisor
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
        supervisor
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
        search
      } = req.query;

      const filter = {};

      if (department) filter.department = department;
      if (position) filter.position = position;
      if (employmentStatus) filter.employmentStatus = employmentStatus;
      if (search) {
        filter.$or = [
          { employeeId: { $regex: search, $options: 'i' } },
          { nik: { $regex: search, $options: 'i' } },
          { position: { $regex: search, $options: 'i' } }
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
        currentPage: page,
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
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
        req.body,
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

  // Deactivate employee
  deactivateEmployee: async (req, res) => {
    try {
      const { resignationDate, resignationReason } = req.body;

      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
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
      const employee = await Employee.findByIdAndUpdate(
        req.params.id,
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
  }
};