// middleware/companyMiddleware.js
import Company from '../models/model_hr/Company.model.js';

export const setCompanyContext = async (req, res, next) => {
  try {
    // Cara 1: Dari query parameter
    if (req.query.companyId) {
      req.companyId = req.query.companyId;
    }
    
    // Cara 2: Dari body (untuk POST/PUT requests)
    else if (req.body.companyId) {
      req.companyId = req.body.companyId;
    }
    
    // Cara 3: Dari user session/jwt (jika user terikat ke company tertentu)
    else if (req.user?.companyId) {
      req.companyId = req.user.companyId;
    }
    
    // Cara 4: Dari header
    else if (req.headers['x-company-id']) {
      req.companyId = req.headers['x-company-id'];
    }

    // Validasi company exists
    if (req.companyId) {
      const company = await Company.findById(req.companyId);
      if (!company) {
        return res.status(404).json({ 
          success: false,
          message: 'Company not found' 
        });
      }
      req.company = company;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const requireCompany = (req, res, next) => {
  if (!req.companyId) {
    return res.status(400).json({ 
      success: false,
      message: 'Company context is required. Please provide companyId in query, body, or header.' 
    });
  }
  next();
};