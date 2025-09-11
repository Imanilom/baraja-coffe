import Role from "../models/Role.model.js";
import mongoose from "mongoose";

// ✅ Buat role baru
export const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    // Cek apakah role sudah ada
    const existing = await Role.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = new Role({
      name,
      description,
      permissions,
    });

    await role.save();

    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    next(error);
  }
};

// ✅ Ambil semua role
export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    res.status(200).json(roles);
  } catch (error) {
    next(error);
  }
};

// ✅ Ambil detail 1 role
export const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(role);
  } catch (error) {
    next(error);
  }
};

// ✅ Update role
export const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role updated successfully", role });
  } catch (error) {
    next(error);
  }
};

// ✅ Hapus role
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid role ID" });
    }

    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    next(error);
  }
};
