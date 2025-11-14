import { TaxAndService } from '../models/TaxAndService.model.js';
import { Outlet } from '../models/Outlet.model.js';
import LoyaltyLevel from '../models/LoyaltyLevel.model.js';

// ✅ GET: Semua data pajak & service
export const getTax = async (req, res) => {
  try {
    const tax = await TaxAndService.find()
      .populate('appliesToOutlets', 'name')

    // // Print detail untuk debugging
    // console.log('\n=== BACKEND TAX DATA ===');
    // console.log(`Jumlah data tax: ${tax.length}`);

    // tax.forEach((item, index) => {
    //   console.log(`\nTax Item ${index + 1}:`);
    //   console.log(`- ID: ${item._id}`);
    //   console.log(`- Name: ${item.name}`);
    //   console.log(`- Type: ${item.type}`);
    //   console.log(`- Percentage: ${item.percentage}`);
    //   console.log(`- Is Active: ${item.isActive}`);
    //   console.log(`- Applies to outlets: ${item.appliesToOutlets.map(outlet => outlet._id).join(', ')}`);
    //   console.log(`- Outlet Names: ${item.appliesToOutlets.map(outlet => outlet.name).join(', ')}`);
    // });

    // console.log('=== END BACKEND DATA ===\n');

    res.status(200).json({
      success: true,
      data: tax,
      count: tax.length
    });
  } catch (err) {
    console.error('Error retrieving tax data:', err);
    res.status(500).json({
      error: 'Gagal mengambil data pajak dan service.',
      details: err.message
    });
  }
};
export const getAllChargesForCashier = async (req, res) => {
  try {
    const charges = await TaxAndService.find()
      .populate('appliesToOutlets', 'name')
    res.status(200).json({
      status: "success",
      data: charges
    });
  } catch (err) {
    res.status(500).json({
      error: 'Gagal mengambil data pajak dan service.',
      details: err.message
    });
  }
};

// ✅ GET: Satu charge by ID
export const getChargeById = async (req, res) => {
  try {
    const charge = await TaxAndService.findById(req.params.id)
      .populate('appliesToOutlets', 'name')

    if (!charge) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json(charge);
  } catch (err) {
    res.status(500).json({
      error: 'Gagal mengambil data.',
      details: err.message
    });
  }
};

// ✅ POST: Tambah tax/service baru
export const createCharge = async (req, res) => {
  try {
    const { type, appliesToOutlets } = req.body;

    // Basic validation
    if (!type || !['tax', 'service'].includes(type)) {
      return res.status(400).json({ error: 'Jenis pajak/layanan tidak valid' });
    }

    if (!appliesToOutlets || !Array.isArray(appliesToOutlets) || appliesToOutlets.length === 0) {
      return res.status(400).json({ error: 'Harus memilih minimal satu outlet' });
    }

    // Create the charge
    const newCharge = new TaxAndService(req.body);
    await newCharge.save();

    res.status(201).json({
      success: true,
      message: type === 'tax' ? 'Pajak berhasil dibuat' : 'Layanan berhasil dibuat',
      data: newCharge
    });
  } catch (err) {
    console.error('Error creating charge:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Gagal membuat data'
    });
  }
};


// ✅ PUT: Update tax/service
export const updateCharge = async (req, res) => {
  try {
    const { appliesToOutlets, appliesToCustomerTypes } = req.body;

    // Validasi appliesToOutlets jika disertakan
    if (appliesToOutlets !== undefined) {
      if (!Array.isArray(appliesToOutlets) || appliesToOutlets.length === 0) {
        return res.status(400).json({ error: 'Harus memilih minimal satu outlet.' });
      }

      const outletsExist = await Outlet.find({
        _id: { $in: appliesToOutlets }
      });

      if (outletsExist.length !== appliesToOutlets.length) {
        return res.status(400).json({ error: 'Beberapa outlet tidak ditemukan.' });
      }
    }



    // Siapkan payload update
    const updateData = {
      ...req.body,
      appliesToOutlets: appliesToOutlets || undefined,
    };

    const updated = await TaxAndService.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({
      error: 'Gagal mengubah data.',
      details: err.message
    });
  }
};

// ✅ DELETE: Hapus tax/service
export const deleteCharge = async (req, res) => {
  try {
    const deleted = await TaxAndService.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ error: 'Data tidak ditemukan.' });

    res.status(200).json({ message: 'Berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({
      error: 'Gagal menghapus data.',
      details: err.message
    });
  }
};