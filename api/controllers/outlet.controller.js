import { Outlet } from '../models/Outlet.model.js';
import Location from '../models/Location.model.js';
import mongoose from 'mongoose';

// ===============================
// CREATE OUTLET
// ===============================
export const createOutlet = async (req, res) => {
  try {
    const { 
      name, 
      address, 
      city, 
      location, 
      contactNumber, 
      admin, 
      outletPictures,
      openTime,
      closeTime
    } = req.body;

    const newOutlet = new Outlet({
      name,
      address,
      city,
      location,
      contactNumber,
      admin: admin && mongoose.Types.ObjectId.isValid(admin) 
        ? new mongoose.Types.ObjectId(admin) 
        : null,
      outletPictures: outletPictures?.length > 0 
        ? outletPictures 
        : ['https://placehold.co/1920x1080/png'],
      openTime: openTime || '08:00',
      closeTime: closeTime || '22:00',
    });

    const savedOutlet = await newOutlet.save();

    return res.status(201).json({
      success: true,
      message: 'Outlet created successfully',
      data: savedOutlet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create outlet',
      error: error.message,
    });
  }
};

// ===============================
// GET ALL OUTLETS
// ===============================
export const getAllOutlets = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const outlets = await Outlet.find(query).populate('admin');

    return res.status(200).json({
      success: true,
      data: outlets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch outlets',
      error: error.message,
    });
  }
};

// ===============================
// GET OUTLET BY ID
// ===============================
export const getOutletById = async (req, res) => {
  try {
    const { id } = req.params;

    const outlet = await Outlet.findById(id).populate('admin');
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: outlet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch outlet',
      error: error.message,
    });
  }
};

// ===============================
// UPDATE OUTLET
// ===============================
export const updateOutlet = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert admin to ObjectId
    if (updateData.admin && mongoose.Types.ObjectId.isValid(updateData.admin)) {
      updateData.admin = new mongoose.Types.ObjectId(updateData.admin);
    }

    const updatedOutlet = await Outlet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, session }
    ).populate('admin');

    if (!updatedOutlet) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    // Update lokasi jika ada
    if (updateData.locationData) {
      const locationData = updateData.locationData;

      if (
        !locationData.coordinates ||
        !Array.isArray(locationData.coordinates.coordinates) ||
        locationData.coordinates.coordinates.length !== 2
      ) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }',
        });
      }

      await Location.findOneAndUpdate(
        { outlet: id, isPrimary: true },
        {
          ...locationData,
          outlet: id,
          coordinates: {
            type: 'Point',
            coordinates: locationData.coordinates.coordinates,
          },
        },
        { new: true, upsert: true, runValidators: true, session }
      );
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Outlet updated successfully',
      data: updatedOutlet,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: 'Failed to update outlet',
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ===============================
// TOGGLE OUTLET ACTIVE STATUS
// ===============================
export const toggleOutletStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const outlet = await Outlet.findById(id);
    if (!outlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    outlet.isActive = !outlet.isActive;
    await outlet.save();

    return res.status(200).json({
      success: true,
      message: `Outlet ${outlet.isActive ? 'activated' : 'deactivated'} successfully`,
      data: outlet,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle outlet status',
      error: error.message,
    });
  }
};

// ===============================
// DELETE OUTLET
// ===============================
export const deleteOutlet = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOutlet = await Outlet.findByIdAndDelete(id);
    if (!deletedOutlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found',
      });
    }

    await Location.deleteMany({ outlet: id });

    return res.status(200).json({
      success: true,
      message: 'Outlet deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete outlet',
      error: error.message,
    });
  }
};

// ===============================
// GET OUTLET LOCATIONS
// ===============================
export const getOutletLocations = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, isPrimary } = req.query;

    const query = { outlet: id };
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (isPrimary !== undefined) query.isPrimary = isPrimary === 'true';

    const locations = await Location.find(query);

    return res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch outlet locations',
      error: error.message,
    });
  }
};

// ===============================
// ADD LOCATION TO OUTLET
// ===============================
export const addOutletLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const locationData = req.body;

    if (
      !locationData.coordinates ||
      !Array.isArray(locationData.coordinates.coordinates) ||
      locationData.coordinates.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates format. Expected { coordinates: [longitude, latitude] }',
      });
    }

    const newLocation = new Location({
      ...locationData,
      outlet: id,
      user: null,
      coordinates: {
        type: 'Point',
        coordinates: locationData.coordinates.coordinates,
      },
    });

    const savedLocation = await newLocation.save();

    return res.status(201).json({
      success: true,
      message: 'Location added to outlet successfully',
      data: savedLocation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add location to outlet',
      error: error.message,
    });
  }
};

// ===============================
// GET NEARBY OUTLETS
// ===============================
export const getNearbyOutlets = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 5000 } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required',
      });
    }

    const outletsWithLocations = await Location.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: 'distance',
          maxDistance: parseInt(maxDistance),
          spherical: true,
          query: { outlet: { $exists: true } },
        },
      },
      {
        $lookup: {
          from: 'outlets',
          localField: 'outlet',
          foreignField: '_id',
          as: 'outlet',
        },
      },
      { $unwind: '$outlet' },
      { $match: { 'outlet.isActive': true } },
      {
        $project: {
          _id: 0,
          outlet: 1,
          distance: 1,
          label: 1,
          address: 1,
        },
      },
      { $sort: { distance: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: outletsWithLocations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to find nearby outlets',
      error: error.message,
    });
  }
};
