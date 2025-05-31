import { TableLayout } from '../models/TableLayout.model.js';
import { Outlet } from '../models/Outlet.model.js';
import mongoose from 'mongoose';

export const createTableLayout = async (req, res) => {
  try {
    const { outletId, sections, layoutImage, lastUpdatedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    const layout = new TableLayout({
      outletId,
      sections,
      layoutImage,
      lastUpdatedBy
    });

    await layout.save();
    res.status(201).json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTableLayoutByOutlet = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    const layout = await TableLayout.findOne({ outletId }).exec();

    if (!layout) {
      return res.status(404).json({ message: 'Table layout not found' });
    }

    res.json(layout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTableLayout = async (req, res) => {
  try {
    const { outletId } = req.params;
    const { sections, layoutImage, lastUpdatedBy } = req.body;

    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    const updatedLayout = await TableLayout.findOneAndUpdate(
      { outletId },
      { sections, layoutImage, lastUpdatedBy },
      { new: true, runValidators: true }
    ).exec();

    if (!updatedLayout) {
      return res.status(404).json({ message: 'Table layout not found' });
    }

    res.json(updatedLayout);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTableLayout = async (req, res) => {
  try {
    const { outletId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    const result = await TableLayout.deleteOne({ outletId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Table layout not found' });
    }

    res.json({ message: 'Table layout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTableStatusByOutlet = async (req, res) => {
  try {
    const { outletId } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    // Cari layout berdasarkan outletId
    const layout = await TableLayout.findOne({ outletId }).exec();

    if (!layout) {
      return res.status(404).json({ message: 'Table layout not found for this outlet' });
    }

    // Format hasil yang akan dikirim ke client
    const tableStatus = layout.sections.map(section => ({
      sectionName: section.name,
      sectionColor: section.colorCode,
      tables: section.tables.map(table => ({
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        position: table.position,
        status: table.status,
        shape: table.shape,
        notes: table.notes,
        _id: table._id
      }))
    }));

    res.json({
      outletId: layout.outletId,
      layoutImage: layout.layoutImage,
      sections: tableStatus
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getAvailableTablesByPeople = async (req, res) => {
  try {
    const { outletId } = req.params;

    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID' });
    }

    const people = parseInt(req.query.people, 10);
    if (isNaN(people) || people <= 0) {
      return res.status(400).json({ message: 'Please provide a valid number of people' });
    }

    // Cari layout berdasarkan outletId
    const layout = await TableLayout.findOne({ outletId }).exec();

    if (!layout) {
      return res.status(404).json({ message: 'Table layout not found for this outlet' });
    }

    // Filter section & table
    const availableSections = layout.sections
      .map(section => {
        const filteredTables = section.tables.filter(table =>
          table.status === 'available' && table.capacity >= people
        );

        return {
          sectionName: section.name,
          sectionColor: section.colorCode,
          tables: filteredTables.map(table => ({
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            position: table.position,
            shape: table.shape,
            notes: table.notes,
            _id: table._id
          }))
        };
      })
      .filter(section => section.tables.length > 0); // Hilangkan section tanpa meja tersedia

    res.json({
      outletId: layout.outletId,
      sections: availableSections
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};