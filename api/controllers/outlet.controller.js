import { Outlet } from '../models/Outlet.model.js';
import Location from '../models/Location.model.js';
import mongoose from 'mongoose';

// Create a new outlet
export const createOutlet = async (req, res) => {
  try {
    const { name, address, city, location, contactNumber, admin, outletPictures } = req.body;
    
    const newOutlet = new Outlet({
      name,
      address,
      city,
      location,
      contactNumber,
      admin: admin ? new mongoose.Types.ObjectId(admin) : null,
      outletPictures: outletPictures || ['https://placehold.co/1920x1080/png']
    });

    const savedOutlet = await newOutlet.save();
    
    res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      data: savedOutlet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create outlet',
      error: error.message
    });
  }
};

// Get all outlets
export const getAllOutlets = async (req, res) => {
  try {
    const { isActive } = req.query;
    let query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const outlets = await Outlet.find(query).populate('admin');
    
    res.status(200).json({
      success: true,
      data: outlets
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outlets',
      error: error.message
    });
  }
};

// Get single outlet by ID
export const getOutletById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const outlet = await Outlet.findById(id).populate('admin');
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: outlet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outlet',
      error: error.message
    });
  }
};

// Update outlet
// Update outlet + location
export const updateOutlet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle admin ID
    if (updateData.admin) {
      updateData.admin = new mongoose.Types.ObjectId(updateData.admin);
    }

    // Update Outlet utama
    const updatedOutlet = await Outlet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
    ).populate('admin');

    if (!updatedOutlet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    // Kalau ada data lokasi yang dikirim, update juga
    if (updateData.locationData) {
      const locationData = updateData.locationData;

      // Validasi koordinat
      if (!locationData.coordinates || 
          !Array.isArray(locationData.coordinates.coordinates) || 
          locationData.coordinates.coordinates.length !== 2) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }',
        });
      }

      // Update lokasi utama outlet (yang punya field outlet = id)
      await Location.findOneAndUpdate(
        { outlet: id, isPrimary: true }, // update lokasi utama
        {
          ...locationData,
          outlet: id,
          user: null,
          coordinates: {
            type: 'Point',
            coordinates: locationData.coordinates.coordinates,
          },
        },
        { new: true, upsert: true, runValidators: true, session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Outlet updated successfully',
      data: updatedOutlet,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Failed to update outlet',
      error: error.message,
    });
  }
};

// Toggle outlet active status
export const toggleOutletStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const outlet = await Outlet.findById(id);
    
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    outlet.isActive = !outlet.isActive;
    await outlet.save();
    
    res.status(200).json({
      success: true,
      message: `Outlet ${outlet.isActive ? 'activated' : 'deactivated'} successfully`,
      data: outlet
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle outlet status',
      error: error.message
    });
  }
};

// Delete outlet
export const deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedOutlet = await Outlet.findByIdAndDelete(id);
    
    if (!deletedOutlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found'
      });
    }
    
    // Also delete all associated locations
    await Location.deleteMany({ outlet: id });
    
    res.status(200).json({
      success: true,
      message: 'Outlet deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete outlet',
      error: error.message
    });
  }
};

// Get all locations for an outlet
export const getOutletLocations = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isPrimary } = req.query;
    
    let query = { outlet: id };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (isPrimary !== undefined) {
      query.isPrimary = isPrimary === 'true';
    }
    
    const locations = await Location.find(query);
    
    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outlet locations',
      error: error.message
    });
  }
};

// Add location to outlet
export const addOutletLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const locationData = req.body;
    
    // Validate that coordinates are provided and in correct format
    if (!locationData.coordinates || !Array.isArray(locationData.coordinates.coordinates) || 
        locationData.coordinates.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }'
      });
    }
    
    const newLocation = new Location({
      ...locationData,
      outlet: id,
      user: null, // Ensure user is null since this is for outlet
      coordinates: {
        type: 'Point',
        coordinates: locationData.coordinates.coordinates
      }
    });
    
    const savedLocation = await newLocation.save();
    
    res.status(201).json({
      success: true,
      message: 'Location added to outlet successfully',
      data: savedLocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add location to outlet',
      error: error.message
    });
  }
};

// Get nearby outlets based on coordinates
export const getNearbyOutlets = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }
    
    const outletsWithLocations = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { outlet: { $exists: true } } // Only outlet locations
        }
      },
      {
        $lookup: {
          from: 'outlets',
          localField: 'outlet',
          foreignField: '_id',
          as: 'outlet'
        }
      },
      {
        $unwind: '$outlet'
      },
      {
        $match: {
          'outlet.isActive': true
        }
      },
      {
        $project: {
          _id: 0,
          outlet: 1,
          distance: 1,
          label: 1,
          address: 1
        }
      },
      {
        $sort: {
          distance: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: outletsWithLocations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby outlets',
      error: error.message
    });
  }
};