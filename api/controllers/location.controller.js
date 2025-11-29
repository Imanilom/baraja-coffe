import Location from '../models/Location.model.js';
import mongoose from 'mongoose';

// Create a new location (generic - can be for user or outlet)
export const createLocation = async (req, res) => {
  try {
    const locationData = req.body;
    
    // Validate that either user or outlet is provided
    if (!locationData.user && !locationData.outlet) {
      return res.status(400).json({
        success: false,
        message: 'Either user or outlet must be provided'
      });
    }
    
    // Validate coordinates
    if (!locationData.coordinates || !Array.isArray(locationData.coordinates.coordinates) || 
        locationData.coordinates.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }'
      });
    }
    
    const newLocation = new Location({
      ...locationData,
      coordinates: {
        type: 'Point',
        coordinates: locationData.coordinates.coordinates
      }
    });
    
    const savedLocation = await newLocation.save();
    
    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: savedLocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message
    });
  }
};

// Get location by ID
export const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findById(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message
    });
  }
};

// Update location
export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If coordinates are being updated, validate them
    if (updateData.coordinates) {
      if (!Array.isArray(updateData.coordinates.coordinates) || 
          updateData.coordinates.coordinates.length !== 2) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }'
        });
      }
      
      updateData.coordinates = {
        type: 'Point',
        coordinates: updateData.coordinates.coordinates
      };
    }
    
    const updatedLocation = await Location.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: updatedLocation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Delete location
export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedLocation = await Location.findByIdAndDelete(id);
    
    if (!deletedLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

// Set location as primary
export const setPrimaryLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findById(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    // Setting isPrimary to true will trigger the pre-save middleware
    // which will set all other locations for this user/outlet to non-primary
    location.isPrimary = true;
    await location.save();
    
    res.status(200).json({
      success: true,
      message: 'Location set as primary successfully',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to set location as primary',
      error: error.message
    });
  }
};

// Toggle location active status
export const toggleLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const location = await Location.findById(id);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }
    
    location.isActive = !location.isActive;
    await location.save();
    
    res.status(200).json({
      success: true,
      message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
      data: location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle location status',
      error: error.message
    });
  }
};

// Get locations near a point
export const getLocationsNearby = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }
    
    const locations = await Location.find({
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isActive: true
    });
    
    res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby locations',
      error: error.message
    });
  }
};