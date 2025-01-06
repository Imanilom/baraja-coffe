import { Outlet } from '../models/Outlet.model.js';

// Create new outlet
export const createOutlet = async (req, res) => {
  try {
    const { name, location, contactNumber, latitude, longitude, outletPictures } = req.body;

    const newOutlet = new Outlet({
      name,
      location,
      contactNumber,
      latitude,
      longitude,
      outletPictures,
    });

    await newOutlet.save();
    res.status(201).json({ message: 'Outlet created successfully', data: newOutlet });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create outlet', error: error.message });
  }
};

// Get all outlets
export const getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.find();
    res.status(200).json(outlets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch outlets', error: error.message });
  }
};

// Get outlet by ID
export const getOutletById = async (req, res) => {
  try {
    const { id } = req.params;
    const outlet = await Outlet.findById(id);

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
    const { name, location, contactNumber, latitude, longitude, outletPictures } = req.body;

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      id,
      { name, location, contactNumber, latitude, longitude, outletPictures },
      { new: true }
    );

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
    const { latitude, longitude, maxDistance } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const maxDistanceInRadians = maxDistance ? maxDistance / 6371 : 10 / 6371; // Default 10 km radius
    const outlets = await Outlet.find({
      location: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], maxDistanceInRadians],
        },
      },
    });

    res.status(200).json(outlets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to find nearest outlets', error: error.message });
  }
};
