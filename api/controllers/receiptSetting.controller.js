import { ReceiptSetting } from '../models/ReceiptSetting.model.js';

/**
 * Ambil pengaturan struk berdasarkan outletId
 */
export async function getSettingByOutletId(req, res) {
  try {
    const { outletId } = req.params;

    const setting = await ReceiptSetting.findOne({ outlet: outletId });

    if (!setting) {
      return res.status(404).json({ message: 'Pengaturan struk tidak ditemukan untuk outlet ini.' });
    }

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data pengaturan struk.', error: error.message });
  }
}

/**
 * Buat atau perbarui pengaturan struk
 */
export async function createOrUpdateSetting(req, res) {
  try {
    const data = req.body;

    const existing = await ReceiptSetting.findOne({ outlet: data.outlet });

    let savedSetting;

    if (existing) {
      // Update
      existing.set(data);
      savedSetting = await existing.save();
    } else {
      // Create
      savedSetting = await ReceiptSetting.create(data);
    }

    res.json({
      message: existing ? 'Pengaturan diperbarui.' : 'Pengaturan dibuat.',
      data: savedSetting
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan pengaturan struk.', error: error.message });
  }
}

/**
 * Hapus pengaturan struk berdasarkan outletId
 */
export async function deleteSetting(req, res) {
  try {
    const { outletId } = req.params;

    const result = await ReceiptSetting.findOneAndDelete({ outlet: outletId });

    if (!result) {
      return res.status(404).json({ message: 'Pengaturan tidak ditemukan atau sudah dihapus.' });
    }

    res.json({ message: 'Pengaturan struk berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus pengaturan struk.', error: error.message });
  }
}
