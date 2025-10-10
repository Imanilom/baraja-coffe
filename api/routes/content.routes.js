import express from 'express';
import {
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
} from '../controllers/content.controller.js';

import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

const contentAccess = verifyToken(['superadmin', 'admin', 'marketing']);

// Create a new content
router.post('/', contentAccess, createContent);

// Get all contents
router.get('/', getContents);

// Get a content by ID
router.get('/:id', getContentById);

// Update a content by ID
router.put('/:id', contentAccess, updateContent);

// Delete a content by ID
router.delete('/:id', contentAccess, deleteContent);

export default router;
