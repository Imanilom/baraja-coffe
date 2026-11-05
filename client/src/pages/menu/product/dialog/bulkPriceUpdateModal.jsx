import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaSearch, FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaEdit, FaSave } from "react-icons/fa";
import axios from '@/lib/axios';
import { useSelector } from "react-redux";

export default function BulkPriceUpdateModal({ isOpen, onClose, menuItems, categories, fetchData }) {
  const { currentUser } = useSelector((state) => state.user);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Price change states
  // maps menuItemId -> newPrice string/number
  const [editedPrices, setEditedPrices] = useState({});

  // Status map: menuItemId -> 'idle' | 'changed' | 'saving' | 'success' | 'error'
  const [rowStatus, setRowStatus] = useState({});

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0 });
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  // Initialize edited prices mapping
  useEffect(() => {
    if (isOpen && menuItems) {
      const initialPrices = {};
      const initialStatus = {};
      menuItems.forEach((item) => {
        initialPrices[item.id] = item.originalPrice;
        initialStatus[item.id] = 'idle';
      });
      setEditedPrices(initialPrices);
      setRowStatus(initialStatus);
      // Reset progress
      setIsSaving(false);
      setProgress({ total: 0, current: 0 });
      setErrors([]);
      setSuccessCount(0);
      setSearchQuery("");
      setSelectedCategory("");
    }
  }, [isOpen, menuItems]);

  // Filtered menu items to display in the grid
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter((item) => {
      const matchSearch = !searchQuery || item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = !selectedCategory || 
        (Array.isArray(item.category) 
          ? item.category.some(c => c.name === selectedCategory) 
          : item.category?.name === selectedCategory);
      return matchSearch && matchCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  // Count items with modified prices
  const changedItemsCount = useMemo(() => {
    let count = 0;
    if (!menuItems) return 0;
    menuItems.forEach((item) => {
      const currentVal = editedPrices[item.id];
      if (currentVal !== undefined && parseFloat(currentVal) !== item.originalPrice) {
        count++;
      }
    });
    return count;
  }, [editedPrices, menuItems]);

  if (!isOpen) return null;

  // Handle value changes in input fields
  const handlePriceChange = (itemId, val) => {
    setEditedPrices(prev => ({ ...prev, [itemId]: val }));
    
    // Determine status
    const originalItem = menuItems.find(item => item.id === itemId);
    if (!originalItem) return;
    
    const parsedVal = parseFloat(val);
    const hasChanged = !isNaN(parsedVal) && parsedVal !== originalItem.originalPrice;
    
    setRowStatus(prev => ({
      ...prev,
      [itemId]: hasChanged ? 'changed' : 'idle'
    }));
  };

  // Keyboard navigation logic: Enter/ArrowDown/ArrowUp
  const handleKeyDown = (e, index) => {
    const inputs = document.querySelectorAll(".bulk-price-input");
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = inputs[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevInput = inputs[index - 1];
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  // Batch save the modified prices
  const handleSaveChanges = async () => {
    // 1. Identify which items actually changed
    const itemsToUpdate = menuItems.filter(item => {
      const editedVal = editedPrices[item.id];
      return editedVal !== undefined && parseFloat(editedVal) !== item.originalPrice;
    });

    if (itemsToUpdate.length === 0) return;

    // 2. Setup progress tracker
    setIsSaving(true);
    setProgress({ total: itemsToUpdate.length, current: 0 });
    setErrors([]);
    setSuccessCount(0);

    const batchSize = 5; // Concurrently fetch & update in batches of 5
    const idsToUpdate = itemsToUpdate.map(item => item.id);

    for (let i = 0; i < idsToUpdate.length; i += batchSize) {
      const batch = idsToUpdate.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (id) => {
        // Mark row status as saving
        setRowStatus(prev => ({ ...prev, [id]: 'saving' }));
        const itemName = menuItems.find(m => m.id === id)?.name || id;

        try {
          // A. Fetch current full details of item to prevent overwriting sub-fields (toppings, addons, availableAt)
          const res = await axios.get(`/api/menu/menu-items/${id}`);
          const fullItem = res.data.data;

          const newPrice = parseFloat(editedPrices[id]);
          if (isNaN(newPrice)) {
            throw new Error("Harga harus berupa angka yang valid.");
          }

          // B. Construct payload (mapping category details to ID parameters expected by controller)
          const payload = {
            ...fullItem,
            price: newPrice,
            category: fullItem.category?._id || fullItem.category?.id || fullItem.category,
            subCategory: fullItem.subCategory ? (fullItem.subCategory._id || fullItem.subCategory.id || fullItem.subCategory) : null,
            availableAt: fullItem.availableAt ? fullItem.availableAt.map(o => o._id || o) : []
          };

          // C. Put back the updated item
          await axios.put(`/api/menu/menu-items/${id}`, payload, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });

          // D. Complete status
          setRowStatus(prev => ({ ...prev, [id]: 'success' }));
          setSuccessCount(prev => prev + 1);
        } catch (err) {
          console.error(`Failed to update ${itemName} (${id}):`, err);
          setRowStatus(prev => ({ ...prev, [id]: 'error' }));
          
          const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message;
          setErrors(prev => [...prev, { name: itemName, message: errorMessage }]);
        } finally {
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }));
    }

    // Refresh menu items list in the parent screen
    if (fetchData) {
      await fetchData();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-300">
      <div className="bg-white w-full max-w-6xl h-[88vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 relative">
        
        {/* Header Section */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 font-['Outfit',sans-serif]">
              <span className="p-2 bg-[#005429]/10 text-[#005429] rounded-xl"><FaEdit size={18} /></span>
              Ubah Harga Massal
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Ketik langsung harga baru pada kolom input. Tekan <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-bold">Enter</kbd> atau <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px] font-bold">↓</kbd> untuk pindah baris secara cepat.
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

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-col md:flex-row gap-3 bg-white">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari menu berdasarkan nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#005429] transition-all"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto py-1 max-w-full md:max-w-lg">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                selectedCategory === ""
                  ? "bg-[#005429] text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat.name
                    ? "bg-[#005429] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Spreadsheet Table Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50/30">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-100/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <th className="p-3 text-left rounded-l-xl border-b border-slate-200">Produk</th>
                <th className="p-3 text-left border-b border-slate-200">Kategori</th>
                <th className="p-3 text-right border-b border-slate-200">Harga Lama</th>
                <th className="p-3 text-left border-b border-slate-200 w-48 pl-8">Harga Baru (Manual)</th>
                <th className="p-3 text-center rounded-r-xl border-b border-slate-200 w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const newPrice = editedPrices[item.id] !== undefined ? editedPrices[item.id] : item.originalPrice;
                  const isChanged = newPrice !== item.originalPrice;
                  
                  return (
                    <tr key={item.id} className="hover:bg-white transition-colors duration-150 group">
                      {/* Image + Name */}
                      <td className="p-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono tracking-tight">ID: {item.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 border-b border-slate-100">
                        <span className="text-slate-600 font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {Array.isArray(item.category)
                            ? item.category.map((c) => c.name).join(", ")
                            : item.category?.name || "-"}
                        </span>
                      </td>

                      {/* Original Price */}
                      <td className="p-3 text-right font-semibold text-slate-500 text-xs border-b border-slate-100">
                        Rp {item.originalPrice?.toLocaleString("id-ID")}
                      </td>

                      {/* Editable New Price Input */}
                      <td className="p-3 border-b border-slate-100 pl-8">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 font-bold pointer-events-none">
                            Rp
                          </span>
                          <input
                            type="number"
                            value={newPrice}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`bulk-price-input w-full pl-8 pr-3 py-1.5 bg-white border rounded-xl text-xs font-black text-slate-800 focus:outline-none transition-all ${
                              isChanged 
                                ? "border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-amber-50/20" 
                                : "border-slate-200 focus:border-[#005429] focus:ring-2 focus:ring-green-100"
                            }`}
                          />
                        </div>
                      </td>

                      {/* Status Icon */}
                      <td className="p-3 text-center border-b border-slate-100">
                        {rowStatus[item.id] === 'idle' && (
                          <span className="text-slate-300"><FaEdit size={14} className="mx-auto" /></span>
                        )}
                        {rowStatus[item.id] === 'changed' && (
                          <span className="text-amber-500 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Diedit</span>
                        )}
                        {rowStatus[item.id] === 'saving' && (
                          <FaSpinner size={14} className="animate-spin text-[#005429] mx-auto" />
                        )}
                        {rowStatus[item.id] === 'success' && (
                          <FaCheckCircle size={15} className="text-emerald-500 mx-auto animate-pulse" />
                        )}
                        {rowStatus[item.id] === 'error' && (
                          <FaExclamationTriangle size={15} className="text-red-500 mx-auto" title="Gagal menyimpan" />
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold">Tidak ada menu yang sesuai filter pencarian</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Panel */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md z-10">
          <div>
            {changedItemsCount > 0 ? (
              <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                {changedItemsCount} menu telah dirubah harganya.
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Belum ada perubahan harga.</p>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isSaving && progress.current < progress.total}
              className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
            >
              Batal
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={changedItemsCount === 0 || (isSaving && progress.current < progress.total)}
              className="flex-1 sm:flex-initial px-5 py-2 bg-[#005429] hover:bg-[#004220] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5"
            >
              <FaSave size={13} />
              Simpan Semua Perubahan
            </button>
          </div>
        </div>

        {/* Saving Progress Screen Overlay */}
        {isSaving && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-6 transition-all duration-300">
            <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-xl flex flex-col text-center">
              
              {progress.current < progress.total ? (
                <>
                  <div className="w-16 h-16 bg-[#005429]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaSpinner size={24} className="animate-spin text-[#005429]" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 font-['Outfit',sans-serif]">Sedang Menyimpan Perubahan Harga</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-6">Jangan tutup jendela ini hingga proses selesai.</p>
                  
                  {/* Progress bar */}
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
                  <h3 className="text-base font-black text-slate-800 font-['Outfit',sans-serif]">Pembaruan Selesai!</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Berhasil memperbarui harga <strong>{successCount}</strong> menu.
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
                    Tutup Halaman
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
