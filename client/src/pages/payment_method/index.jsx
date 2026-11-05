import React, { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import {
  FaCreditCard,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaSave,
  FaSync,
  FaShieldAlt,
  FaWallet,
  FaUniversity,
  FaQrcode,
  FaMoneyBillWave,
  FaBuilding
} from 'react-icons/fa';
import MessageAlert from '../../components/MessageAlert';

const PaymentMethodManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rawMethods, setRawMethods] = useState([]);
  const [rawTypes, setRawTypes] = useState([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Modal State for Adding New Channel
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannel, setNewChannel] = useState({
    id: '',
    name: '',
    typeCode: '',
    methodIds: ['qris', 'debit'],
    isDigital: false,
    isPtBank: false,
    groOnly: false
  });

  // Alert State
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [alertKey, setAlertKey] = useState(0);

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertKey(prev => prev + 1);
  };

  const fetchPaymentData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/paymentlist/payment-methods-and-types');
      if (res.data && res.data.success) {
        setRawMethods(res.data.rawMethods || []);
        setRawTypes(res.data.rawTypes || []);
      }
    } catch (error) {
      console.error('Gagal mengambil data metode pembayaran:', error);
      showAlert('Gagal memuat daftar metode pembayaran.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentData();
  }, [fetchPaymentData]);

  // Toggle active status for a specific payment channel
  const handleToggleType = async (typeId) => {
    try {
      const updatedTypes = rawTypes.map(t => {
        if (t.id === typeId) {
          return { ...t, isActive: !t.isActive };
        }
        return t;
      });
      setRawTypes(updatedTypes);

      const res = await axios.patch(`/api/paymentlist/toggle-type/${typeId}`);
      if (res.data && res.data.success) {
        showAlert(res.data.message || 'Status metode pembayaran berhasil diperbarui.', 'success');
      }
    } catch (error) {
      console.error('Gagal memperbarui status:', error);
      showAlert('Gagal memperbarui status ke server.', 'error');
      fetchPaymentData(); // Rollback UI if failed
    }
  };

  // Save all modifications
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/paymentlist/payment-methods-and-types', {
        methods: rawMethods,
        types: rawTypes
      });
      if (res.data && res.data.success) {
        showAlert('Seluruh konfigurasi metode pembayaran berhasil disimpan!', 'success');
      }
    } catch (error) {
      console.error('Gagal menyimpan metode pembayaran:', error);
      showAlert('Gagal menyimpan perubahan ke server.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add new payment channel
  const handleAddChannelSubmit = async (e) => {
    e.preventDefault();
    if (!newChannel.name || !newChannel.id) {
      showAlert('ID dan Nama Metode Pembayaran wajib diisi!', 'error');
      return;
    }

    try {
      const res = await axios.post('/api/paymentlist/payment-types', newChannel);
      if (res.data && res.data.success) {
        showAlert('Tipe pembayaran baru berhasil ditambahkan!', 'success');
        setShowAddModal(false);
        setNewChannel({
          id: '',
          name: '',
          typeCode: '',
          methodIds: ['qris', 'debit'],
          isDigital: false,
          isPtBank: false,
          groOnly: false
        });
        fetchPaymentData();
      }
    } catch (error) {
      console.error('Gagal menambahkan tipe pembayaran:', error);
      showAlert(error.response?.data?.message || 'Gagal menambahkan tipe pembayaran baru.', 'error');
    }
  };

  // Filtered types list based on selected category tab
  const filteredTypes = rawTypes.filter(t => {
    if (activeCategoryFilter === 'all') return true;
    if (activeCategoryFilter === 'digital') return t.isDigital;
    if (activeCategoryFilter === 'pt') return t.isPtBank;
    return t.methodIds && t.methodIds.includes(activeCategoryFilter);
  });

  const getIconForType = (type) => {
    if (type.isDigital) return <FaWallet className="text-emerald-500" />;
    if (type.isPtBank) return <FaBuilding className="text-purple-600" />;
    if (type.id === 'cash') return <FaMoneyBillWave className="text-green-600" />;
    return <FaUniversity className="text-blue-600" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {alertMessage && (
        <MessageAlert key={alertKey} message={alertMessage} type={alertType} />
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <FaCreditCard className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Pengaturan Metode Pembayaran</h1>
              <p className="text-emerald-200 text-sm mt-0.5">
                Kelola channel pembayaran kasir (QRIS, E-Wallet, Bank Transfer, Tunai, PT SCN Bank)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPaymentData}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 backdrop-blur-md"
          >
            <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
          >
            <FaPlus className="w-4 h-4" />
            Tambah Channel
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'all', label: 'Semua Channel', count: rawTypes.length },
          { id: 'qris', label: 'QRIS', count: rawTypes.filter(t => t.methodIds?.includes('qris')).length },
          { id: 'ewallet', label: 'E-Wallet', count: rawTypes.filter(t => t.methodIds?.includes('ewallet')).length },
          { id: 'banktransfer', label: 'Bank Transfer', count: rawTypes.filter(t => t.methodIds?.includes('banktransfer')).length },
          { id: 'debit', label: 'Debit', count: rawTypes.filter(t => t.methodIds?.includes('debit')).length },
          { id: 'pt', label: 'PT SCN Bank (GRO)', count: rawTypes.filter(t => t.isPtBank).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveCategoryFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeCategoryFilter === tab.id
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeCategoryFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Payment Method Types Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-slate-500 text-sm mt-3">Memuat data metode pembayaran...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes.map((type) => (
            <div
              key={type.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                type.isActive ? 'border-slate-200' : 'border-red-200 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-100 rounded-xl text-xl">
                      {getIconForType(type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{type.name}</h3>
                      <span className="text-xs text-slate-500 font-mono">{type.typeCode}</span>
                    </div>
                  </div>

                  {/* Toggle Active Switch */}
                  <button
                    onClick={() => handleToggleType(type.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      type.isActive
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {type.isActive ? (
                      <>
                        <FaCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Aktif
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="w-3.5 h-3.5 text-red-500" />
                        Nonaktif
                      </>
                    )}
                  </button>
                </div>

                {/* Badge Flags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {type.isDigital && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-medium">
                      📱 Digital / Midtrans Snap
                    </span>
                  )}
                  {type.isPtBank && (
                    <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-semibold">
                      🏛️ Bank milik PT
                    </span>
                  )}
                  {type.groOnly && (
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-semibold">
                      ⭐ GRO Only
                    </span>
                  )}
                  {type.methodIds?.map(mId => (
                    <span key={mId} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium uppercase">
                      {mId}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
        <span className="text-xs text-slate-500 flex items-center gap-1.5">
          <FaShieldAlt className="text-emerald-600" /> Perubahan pada status pembayaran akan langsung berdampak di Kasir & Mobile.
        </span>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <FaSave />
          {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>

      {/* Add New Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-800">Tambah Channel Pembayaran</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddChannelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Unik (contoh: dana, shopeepay, muamalat)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. dana"
                  value={newChannel.id}
                  onChange={(e) => setNewChannel({ ...newChannel, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Tampilan (contoh: DANA, ShopeePay, Bank Muamalat)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DANA"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value, typeCode: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Metode (Pilih minimal 1)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {rawMethods.map(m => (
                    <label key={m.id} className="flex items-center gap-1.5 text-xs bg-slate-50 border px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={newChannel.methodIds.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewChannel({ ...newChannel, methodIds: [...newChannel.methodIds, m.id] });
                          } else {
                            setNewChannel({ ...newChannel, methodIds: newChannel.methodIds.filter(id => id !== m.id) });
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      {m.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newChannel.isDigital}
                    onChange={(e) => setNewChannel({ ...newChannel, isDigital: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  📱 Metode Digital / E-Wallet (Integrasi Midtrans / Snap)
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newChannel.isPtBank}
                    onChange={(e) => setNewChannel({ ...newChannel, isPtBank: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  🏛️ Rekening Resmi Milik PT (Instant Settlement tanpa Midtrans)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Simpan Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodManagement;
