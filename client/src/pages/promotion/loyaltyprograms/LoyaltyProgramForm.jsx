import React, { useState } from 'react';
import { Award, Gift, Users, Percent, CheckCircle2, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const LoyaltyProgramForm = ({ onSubmit, initialData = {} }) => {
  const { currentUser } = useSelector((state) => state.user);
  const [levels, setLevels] = useState([]);
  const [form, setForm] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    consumerType: initialData.consumerType || '',
    pointsPerRp: initialData.pointsPerRp || 100,
    registrationPoints: initialData.registrationPoints || 50,
    firstTransactionPoints: initialData.firstTransactionPoints || 100,
    pointsToDiscountRatio: initialData.pointsToDiscountRatio || 100,
    discountValuePerPoint: initialData.discountValuePerPoint || 50,
    isActive: initialData.isActive ?? true,
  });

  const fetchLevels = async () => {
    try {
      const levelsRes = await
        axios.get(`/api/promotion/loyalty-levels`, {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });

      setLevels(levelsRes.data.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchLevels();
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      console.log('Navigate back to /admin/loyalty');
    }
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/loyalty"
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Kembali</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-3 rounded-xl shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {initialData.name ? 'Ubah Program Kesetiaan' : 'Buat Program Kesetiaan'}
              </h1>
              <p className="text-gray-600 mt-1">
                {initialData.name ? 'Perbatui ringkasan program dan pengaturan' : 'Konfigurasi Kesetiaan Program Baru'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div>
            {/* Basic Information Section */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                Informasi Dasar
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Program *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    placeholder="Enter program name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none"
                    placeholder="Describe your loyalty program"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Tipe Pelanggan *
                  </label>
                  <select
                    name="consumerType"
                    value={form.consumerType}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none appearance-none bg-white cursor-pointer"
                    required
                  >
                    <option value="">Pilih Tipe Pelanggan</option>
                    {levels.map((level) => (
                      <option key={level._id || level.name} value={level.name}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Points Configuration Section */}
            <div className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-purple-600" />
                </div>
                Poin & Konfigurasi
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Poin per Rp
                  </label>
                  <input
                    type="number"
                    name="pointsPerRp"
                    value={form.pointsPerRp}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Point didapatkan per rupiah yang digunakan</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Poin Pendaftaran
                  </label>
                  <input
                    type="number"
                    name="registrationPoints"
                    value={form.registrationPoints}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Bonus point Pendaftaran</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Poin Transaksi Pertama
                  </label>
                  <input
                    type="number"
                    name="firstTransactionPoints"
                    value={form.firstTransactionPoints}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Bonus point pada transaksi pertama</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600" />
                    Rasio Diskon Poin
                  </label>
                  <input
                    type="number"
                    name="pointsToDiscountRatio"
                    value={form.pointsToDiscountRatio}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Diskon Poin yang dibutuhkan</p>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-purple-100 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Diskon per Point
                  </label>
                  <input
                    type="number"
                    name="discountValuePerPoint"
                    value={form.discountValuePerPoint}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">Harga Diskon per Point Kesetiaan</p>
                </div>
              </div>
            </div>

            {/* Status & Actions Section */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600"></div>
                    </label>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Status Program</span>
                        {form.isActive && (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {form.isActive ? "Aktif dan Terlihat Pengguna" : "Tidak Aktif dan Tersembunyi"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  to="/admin/loyalty"
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Batal
                </Link>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {initialData.name ? 'Perbarui Program' : 'Buat Program'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgramForm;