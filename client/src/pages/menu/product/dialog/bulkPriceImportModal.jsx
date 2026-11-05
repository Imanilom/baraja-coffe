import React, { useState, useEffect } from "react";
import { FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaUpload, FaSave } from "react-icons/fa";
import ExcelJS from "exceljs";
import axios from '@/lib/axios';
import { useSelector } from "react-redux";

export default function BulkPriceImportModal({ isOpen, onClose, file, menuItems, fetchData }) {
  const { currentUser } = useSelector((state) => state.user);

  const [loadingFile, setLoadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewItems, setPreviewItems] = useState([]);

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  // Trigger parsing when modal opens and file is provided
  useEffect(() => {
    if (isOpen && file && menuItems) {
      parseExcelFile(file);
    }
  }, [isOpen, file, menuItems]);

  const parseExcelFile = (fileToParse) => {
    setLoadingFile(true);
    setErrorMsg("");
    setPreviewItems([]);
    setIsSaving(false);
    setProgress({ total: 0, current: 0 });
    setErrors([]);
    setSuccessCount(0);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const sheet = workbook.getWorksheet(1); // Load first sheet
        if (!sheet) {
          throw new Error("Sheet pertama tidak ditemukan atau file Excel kosong.");
        }

        const itemsToUpdate = [];

        sheet.eachRow((row, rowNumber) => {
          // Data rows start from row 6 in the exporter
          if (rowNumber >= 6) {
            const idCell = row.getCell(2).value;
            const priceCell = row.getCell(6).value;

            // Extract menu item ID safely
            let menuId = idCell;
            if (idCell && typeof idCell === 'object') {
              menuId = idCell.text || idCell.value;
            }
            menuId = menuId ? String(menuId).trim() : "";

            // Extract price value safely
            let price = priceCell;
            if (priceCell && typeof priceCell === 'object') {
              price = priceCell.result !== undefined ? priceCell.result : priceCell.value;
            }

            // Clean price formatting (remove currency symbol, commas, spaces)
            let parsedPrice = NaN;
            if (price !== null && price !== undefined) {
              if (typeof price === 'string') {
                parsedPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
              } else {
                parsedPrice = parseFloat(price);
              }
            }

            if (menuId && !isNaN(parsedPrice)) {
              // Find matching menu item from our loaded system list
              const originalItem = menuItems.find(item => item.id === menuId || item._id === menuId);
              if (originalItem) {
                // If price in Excel is different from originalPrice in system
                if (parsedPrice !== originalItem.originalPrice) {
                  itemsToUpdate.push({
                    id: menuId,
                    name: originalItem.name,
                    imageUrl: originalItem.imageUrl || originalItem.imageURL,
                    categoryName: Array.isArray(originalItem.category)
                      ? originalItem.category.map(c => c.name).join(", ")
                      : originalItem.category?.name || "-",
                    oldPrice: originalItem.originalPrice,
                    newPrice: parsedPrice
                  });
                }
              }
            }
          }
        });

        setPreviewItems(itemsToUpdate);
      } catch (err) {
        console.error("Gagal memproses file Excel:", err);
        setErrorMsg("Gagal memproses file Excel. Pastikan file yang diunggah merupakan file hasil ekspor database menu Anda.");
      } finally {
        setLoadingFile(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg("Gagal membaca file dari komputer Anda.");
      setLoadingFile(false);
    };

    reader.readAsArrayBuffer(fileToParse);
  };

  // Process Batch Updates
  const handleApplyImport = async () => {
    if (previewItems.length === 0) return;

    setIsSaving(true);
    setProgress({ total: previewItems.length, current: 0 });
    setErrors([]);
    setSuccessCount(0);

    const batchSize = 5; // Concurrently update in batches of 5

    for (let i = 0; i < previewItems.length; i += batchSize) {
      const batch = previewItems.slice(i, i + batchSize);

      await Promise.all(batch.map(async (itemToUpdate) => {
        const id = itemToUpdate.id;
        const itemName = itemToUpdate.name;

        try {
          // 1. Fetch current full details of item to prevent overwriting sub-fields (toppings, addons, availableAt)
          const res = await axios.get(`/api/menu/menu-items/${id}`);
          const fullItem = res.data.data;

          // 2. Construct payload with new price
          const payload = {
            ...fullItem,
            price: itemToUpdate.newPrice,
            category: fullItem.category?._id || fullItem.category?.id || fullItem.category,
            subCategory: fullItem.subCategory ? (fullItem.subCategory._id || fullItem.subCategory.id || fullItem.subCategory) : null,
            availableAt: fullItem.availableAt ? fullItem.availableAt.map(o => o._id || o) : []
          };

          // 3. Put back the updated item
          await axios.put(`/api/menu/menu-items/${id}`, payload, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });

          setSuccessCount(prev => prev + 1);
        } catch (err) {
          console.error(`Failed to import price for ${itemName} (${id}):`, err);
          const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
          setErrors(prev => [...prev, { name: itemName, message: errorMessage }]);
        } finally {
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }));
    }

    // Refresh menu items list in parent screen
    if (fetchData) {
      await fetchData();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-300">
      <div className="bg-white w-full max-w-4xl h-[78vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 font-['Outfit',sans-serif]">
              <span className="p-2 bg-[#005429]/10 text-[#005429] rounded-xl"><FaUpload size={16} /></span>
              Import Perubahan Harga Excel
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Sistem telah mendeteksi perbedaan harga dari file Excel yang diunggah. Tinjau perbandingan di bawah sebelum menyimpan.
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSaving && progress.current < progress.total}
            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors disabled:opacity-30"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20">
          {loadingFile ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
              <FaSpinner size={32} className="animate-spin text-[#005429] mb-4" />
              <p className="text-sm font-semibold">Sedang membaca dan menganalisis file Excel...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-16">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                <FaExclamationTriangle size={24} className="text-red-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Gagal Memuat File</h4>
              <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
              <button 
                onClick={onClose} 
                className="mt-6 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Tutup Jendela
              </button>
            </div>
          ) : previewItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-16">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                <FaCheckCircle size={24} className="text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Tidak Ada Perbedaan Harga</h4>
              <p className="text-xs text-slate-500 mt-1">
                Semua harga menu di dalam file Excel Anda sama persis dengan data sistem saat ini. Tidak ada pembaruan yang perlu diterapkan.
              </p>
              <button 
                onClick={onClose} 
                className="mt-6 px-4 py-2 bg-[#005429] text-white hover:bg-[#004220] rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Kembali
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs font-bold text-amber-800 flex items-start gap-2.5 shadow-sm">
                <FaExclamationTriangle size={15} className="mt-0.5 text-amber-500 flex-shrink-0" />
                <div>
                  <p>Konfirmasi Perubahan Harga</p>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                    Terdapat {previewItems.length} menu yang harganya berbeda di file Excel Anda. Klik tombol "Terapkan Pembaruan" di bawah untuk memproses perubahan.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-wider border-b border-slate-100">
                      <th className="p-3">Produk</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-right">Harga Sistem</th>
                      <th className="p-3 text-right text-emerald-600">Harga Excel (Baru)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-8 h-8 rounded-lg object-cover border border-slate-100" 
                            />
                            <div>
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">ID: {item.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 font-medium">{item.categoryName}</td>
                        <td className="p-3 text-right text-slate-500 font-semibold">
                          Rp {item.oldPrice?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600 bg-emerald-50/20">
                          Rp {item.newPrice?.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {previewItems.length > 0 && !loadingFile && !isSaving && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between shadow-md z-10">
            <span className="text-xs font-bold text-slate-500">
              {previewItems.length} menu akan diperbarui harganya.
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleApplyImport}
                className="px-5 py-2 bg-[#005429] hover:bg-[#004220] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <FaSave size={13} />
                Terapkan Pembaruan
              </button>
            </div>
          </div>
        )}

        {/* Progress Overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-xl text-center">
              
              {progress.current < progress.total ? (
                <>
                  <div className="w-16 h-16 bg-[#005429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaSpinner size={24} className="animate-spin text-[#005429]" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 font-['Outfit',sans-serif]">Menerapkan Perubahan Harga</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-6">Pembaruan sedang dikirim ke server. Mohon tunggu.</p>
                  
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2 shadow-inner border border-slate-50">
                    <div 
                      className="bg-gradient-to-r from-[#005429] to-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    <span>Memproses {progress.current} dari {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <FaCheckCircle size={28} className="text-emerald-500 animate-bounce" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 font-['Outfit',sans-serif]">Impor Selesai!</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Berhasil memperbarui harga <strong>{successCount}</strong> menu dari file Excel.
                  </p>

                  {/* Errors display */}
                  {errors.length > 0 && (
                    <div className="mb-6 max-h-40 overflow-y-auto text-left bg-red-50/50 border border-red-100 rounded-2xl p-4 text-slate-700">
                      <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                        <FaExclamationTriangle /> Gagal mengupdate {errors.length} menu:
                      </p>
                      <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1">
                        {errors.map((err, i) => (
                          <li key={i}>
                            <strong>{err.name}</strong>: {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 bg-[#005429] hover:bg-[#004220] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Tutup Jendela
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
