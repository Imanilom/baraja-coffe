import Content from '../models/content.model.js';

// Create new content
export const createContent = async (req, res) => {
  try {
    const { type, imageUrl, description } = req.body;

    const newContent = new Content({ type, imageUrl, description });
    await newContent.save();

    res.status(201).json({ message: 'Content created successfully', data: newContent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create content', error: error.message });
  }
};

// Get all contents
export const getContents = async (req, res) => {
  try {
    const contents = await Content.find();
    res.status(200).json(contents);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch contents', error: error.message });
  }
};

// Get content by ID
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);

    if (!content) return res.status(404).json({ message: 'Content not found' });

    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch content', error: error.message });
  }
};

// Update content
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, imageUrl, description } = req.body;

    const updatedContent = await Content.findByIdAndUpdate(
      id,
      { type, imageUrl, description },
      { new: true }
    );

    if (!updatedContent) return res.status(404).json({ message: 'Content not found' });

    res.status(200).json({ message: 'Content updated successfully', data: updatedContent });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update content', error: error.message });
  }
};

// Delete content
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedContent = await Content.findByIdAndDelete(id);

    if (!deletedContent) return res.status(404).json({ message: 'Content not found' });

    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete content', error: error.message });
  }
};
