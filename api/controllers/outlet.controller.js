import { Outlet } from '../models/Outlet.model.js';

export const createOutlet = async (req, res) => {
  try {
    const { name, address, location, city, latitude, longitude, contactNumber, manager, outletPictures } = req.body;

    const newOutlet = new Outlet({
      name,
      address,
      location,
      city,
      latitude,
      longitude,
      contactNumber,
      manager,
      outletPictures,
    });

    await newOutlet.save();

    res.status(201).json({ message: 'Outlets created successfully', data: newOutlet });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create outlets', error: error.message });
  }
};

export const getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find().populate('admin', 'name email');
    // const outlets = await Outlet.find().populate('manager', 'name email');
    res.status(200).json(outlets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch outlets', error: error.message });
  }
};

// Get outlet by ID
export const getOutletById = async (req, res) => {
  try {
    const { id } = req.params;
    // const outlet = await Outlet.findById(id).populate('manager', 'name email');
    const outlet = await Outlet.findById(id).populate('admin', 'name email');

    if (!outlet) return res.status(404).json({ message: 'Outlet not found' });

    res.status(200).json(outlet);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch outlet', error: error.message });
  }
};

// Update outlet
export const updateOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, latitude, longitude, contactNumber, admin, outletPictures } = req.body;

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      id,
      { name, address, city, latitude, longitude, contactNumber, admin, outletPictures },
      { new: true }
    ).populate('admin', 'name email');

    if (!updatedOutlet) return res.status(404).json({ message: 'Outlet not found' });

    res.status(200).json({ message: 'Outlet updated successfully', data: updatedOutlet });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update outlet', error: error.message });
  }
};

// Delete outlet
export const deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOutlet = await Outlet.findByIdAndDelete(id);

    if (!deletedOutlet) return res.status(404).json({ message: 'Outlet not found' });

    res.status(200).json({ message: 'Outlet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete outlet', error: error.message });
  }
};

// Find nearest outlets
export const findNearestOutlet = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const outlets = await Outlet.find({
      latitude: { $gte: latitude - 0.1, $lte: latitude + 0.1 },
      longitude: { $gte: longitude - 0.1, $lte: longitude + 0.1 },
    });

    res.status(200).json(outlets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to find nearest outlets', error: error.message });
  }
};
