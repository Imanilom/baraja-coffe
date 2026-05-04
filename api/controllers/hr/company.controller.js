import Company from '../../models/model_hr/Company.model.js';
import HRSettings from '../../models/model_hr/HRSetting.model.js';

export const CompanyController = {
  // Get all companies
getAllCompanies: async (req, res) => {
  try {
    const { isActive = 'true', search } = req.query;
    
    const filter = {};
    
    // Perbaikan: Sesuaikan dengan field di database (isActive vs IsActive)
    if (isActive !== undefined) {
      // Cek kedua kemungkinan penulisan field
      filter.$or = [
        { isActive: isActive === 'true' },
        { IsActive: isActive === 'true' }
      ];
    }
    
    if (search) {
      filter.$or = filter.$or || [];
      const searchConditions = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
      
      // Gabungkan kondisi search dengan kondisi isActive jika ada
      if (filter.$or.length > 0) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }
    
    // Alternatif: Cari tanpa filter dulu untuk debug
    const allCompanies = await Company.find({}).sort({ name: 1 });
    
    const companies = await Company.find(filter)
      .sort({ name: 1 })
      .select('-settings'); // Jangan include settings di list

    
    // Jika tidak menemukan dengan filter, coba tanpa filter
    if (companies.length === 0) {
      console.log('No companies found with filter, trying without filter...');
      const allCompaniesWithoutFilter = await Company.find({})
        .sort({ name: 1 })
        .select('-settings');
      
      return res.json({
        success: true,
        data: allCompaniesWithoutFilter,
        total: allCompaniesWithoutFilter.length,
        message: 'No companies found with specified filter, showing all'
      });
    }

    res.json({
      success: true,
      data: companies,
      total: companies.length
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving companies', 
      error: error.message 
    });
  }
},

  // Get company by ID
  getCompanyById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const company = await Company.findById(id);
      
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Error getting company:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving company', 
        error: error.message 
      });
    }
  },

  // Create new company
  createCompany: async (req, res) => {
    try {
      const { code, name, address, phone, email, taxId } = req.body;
      
      // Validasi input
      if (!code || !name) {
        return res.status(400).json({ 
          success: false,
          message: 'Company code and name are required' 
        });
      }

      // Check if company code already exists
      const existingCompany = await Company.findOne({ code });
      if (existingCompany) {
        return res.status(400).json({ 
          success: false,
          message: 'Company code already exists' 
        });
      }

      const companyData = {
        code: code.trim(),
        name: name.trim(),
        address: address?.trim() || '',
        phone: phone?.trim() || '',
        email: email?.trim() || '',
        taxId: taxId?.trim() || '',
        isActive: true
      };

      const company = new Company(companyData);
      await company.save();

      // Create default HR settings for this company
      const hrSettings = new HRSettings({
        company: company._id,
        attendance: company.settings.attendance,
        salaryCalculation: company.settings.salaryCalculation,
        bpjs: company.settings.bpjs,
        deductions: company.settings.deductions
      });
      await hrSettings.save();

      res.status(201).json({
        success: true,
        message: 'Company created successfully',
        data: company
      });
    } catch (error) {
      console.error('Error creating company:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Company code already exists' 
        });
      }
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({ 
          success: false,
          message: 'Validation error',
          errors 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Error creating company', 
        error: error.message 
      });
    }
  },

  // Update company
  updateCompany: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Clean up data
      if (updateData.code) updateData.code = updateData.code.trim();
      if (updateData.name) updateData.name = updateData.name.trim();
      if (updateData.address) updateData.address = updateData.address.trim();
      if (updateData.phone) updateData.phone = updateData.phone.trim();
      if (updateData.email) updateData.email = updateData.email.trim();
      if (updateData.taxId) updateData.taxId = updateData.taxId.trim();

      const company = await Company.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      res.json({
        success: true,
        message: 'Company updated successfully',
        data: company
      });
    } catch (error) {
      console.error('Error updating company:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          message: 'Company code already exists' 
        });
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Error updating company', 
        error: error.message 
      });
    }
  },

  // Deactivate company
  deactivateCompany: async (req, res) => {
    try {
      const { id } = req.params;

      const company = await Company.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      res.json({
        success: true,
        message: 'Company deactivated successfully',
        data: company
      });
    } catch (error) {
      console.error('Error deactivating company:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error deactivating company', 
        error: error.message 
      });
    }
  },

  // Activate company
  activateCompany: async (req, res) => {
    try {
      const { id } = req.params;

      const company = await Company.findByIdAndUpdate(
        id,
        { isActive: true },
        { new: true }
      );

      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      res.json({
        success: true,
        message: 'Company activated successfully',
        data: company
      });
    } catch (error) {
      console.error('Error activating company:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error activating company', 
        error: error.message 
      });
    }
  },

  // Get company settings
  getCompanySettings: async (req, res) => {
    try {
      const { id } = req.params;

      const company = await Company.findById(id).select('settings');
      
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      res.json({
        success: true,
        data: company.settings
      });
    } catch (error) {
      console.error('Error getting company settings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error retrieving company settings', 
        error: error.message 
      });
    }
  },

  // Update company settings
  updateCompanySettings: async (req, res) => {
    try {
      const { id } = req.params;
      const settingsData = req.body;

      // Validate settings structure
      const validSections = ['attendance', 'salaryCalculation', 'bpjs', 'deductions'];
      for (const section of validSections) {
        if (settingsData[section]) {
          // Update only provided fields
          const updatePath = `settings.${section}`;
          settingsData[updatePath] = settingsData[section];
          delete settingsData[section];
        }
      }

      const company = await Company.findByIdAndUpdate(
        id,
        { $set: settingsData },
        { new: true, runValidators: true }
      );

      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }

      // Update corresponding HR settings if they exist
      await HRSettings.findOneAndUpdate(
        { company: id },
        { $set: settingsData },
        { new: true, upsert: true }
      );

      res.json({
        success: true,
        message: 'Company settings updated successfully',
        data: company.settings
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating company settings', 
        error: error.message 
      });
    }
  }
};