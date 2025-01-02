import express from 'express';
import {
  createContent,
  getContents,
  getContentById,
  updateContent,
  deleteContent,
} from '../controllers/content.controller.js';

const router = express.Router();

// Create a new content
router.post('/', createContent);

// Get all contents
router.get('/', getContents);

// Get a content by ID
router.get('/:id', getContentById);

// Update a content by ID
router.put('/:id', updateContent);

// Delete a content by ID
router.delete('/:id', deleteContent);

export default router;
