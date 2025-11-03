import Document from '../../models/model_hr/Documents.model.js';
import Employee from '../../models/model_hr/Employee.model.js';

export const documentController = {
  // Create document
  createDocument: async (req, res) => {
    try {
      const documentData = {
        ...req.body,
        files: req.files ? req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        })) : []
      };

      const document = new Document(documentData);
      await document.save();
      await document.populate('employee approvedBy');

      res.status(201).json({
        message: 'Document created successfully',
        data: document
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all documents with filtering
  getAllDocuments: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        employeeId,
        startDate,
        endDate
      } = req.query;

      const filter = {};

      if (type) filter.type = type;
      if (status) filter.status = status;
      if (employeeId) filter.employee = employeeId;
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const documents = await Document.find(filter)
        .populate('employee approvedBy')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Document.countDocuments(filter);

      res.json({
        data: documents,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get documents by employee
  getDocumentsByEmployee: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { type, status, page = 1, limit = 10 } = req.query;

      const filter = { employee: employeeId };

      if (type) filter.type = type;
      if (status) filter.status = status;

      const documents = await Document.find(filter)
        .populate('employee approvedBy')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Document.countDocuments(filter);

      res.json({
        data: documents,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update document status (approval)
  updateDocumentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, rejectionReason, approvedBy } = req.body;

      const updateData = {
        status,
        approvedBy: status === 'approved' ? approvedBy : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectionReason: status === 'rejected' ? rejectionReason : null
      };

      const document = await Document.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('employee approvedBy');

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({
        message: `Document ${status} successfully`,
        data: document
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Upload additional files to document
  uploadDocumentFiles: async (req, res) => {
    try {
      const { id } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      const newFiles = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }));

      const document = await Document.findByIdAndUpdate(
        id,
        { $push: { files: { $each: newFiles } } },
        { new: true }
      ).populate('employee approvedBy');

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({
        message: 'Files uploaded successfully',
        data: document
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete document
  deleteDocument: async (req, res) => {
    try {
      const document = await Document.findByIdAndDelete(req.params.id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};