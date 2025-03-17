import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

const RawMaterialPage = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    minimumStock: 0,
    maximumStock: 0,
    costPerUnit: 0,
    supplier: '',
    expiryDate: null,
  });
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get('/api/storage/raw-material');
      setRawMaterials(response.data.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch raw materials');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : (name === 'expiryDate' ? e.target.value : value);
    setFormData({
      ...formData,
      [name]: name === 'expiryDate' 
        ? (val === '' ? null : dayjs(val).toISOString()) 
        : (name in [ 'quantity', 'minimumStock', 'maximumStock', 'costPerUnit' ] 
          ? parseInt(val) 
          : val)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: '',
      minimumStock: 0,
      maximumStock: 0,
      costPerUnit: 0,
      supplier: '',
      expiryDate: null,
    });
    setIsEditing(false);
    setEditId(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/storage/raw-material/${editId}`, formData);
      } else {
        await axios.post('/api/storage/raw-material', formData);
      }
      resetForm();
      fetchRawMaterials();
      setError(null);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save raw material');
    }
  };

  const handleEdit = (material) => {
    setFormData({
      ...material,
      expiryDate: material.expiryDate ? dayjs(material.expiryDate).format('YYYY-MM-DD') : null,
    });
    setIsEditing(true);
    setEditId(material._id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await axios.delete(`/api/storage/raw-material/${id}`);
        fetchRawMaterials();
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete raw material');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Bahan Baku Manajemen</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form 
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nama Bahan
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Kategori
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Pilih Kategori</option>
            <option value="kemasan">Kemasan</option>
            <option value="bahan_makanan">Bahan Makanan</option>
            <option value="peralatan">Peralatan</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Jumlah Stok
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Satuan
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Stok Minimum
          </label>
          <input
            type="number"
            name="minimumStock"
            value={formData.minimumStock}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Stok Maksimum
          </label>
          <input
            type="number"
            name="maximumStock"
            value={formData.maximumStock}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Harga Per Unit
          </label>
          <input
            type="number"
            name="costPerUnit"
            value={formData.costPerUnit}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Pemasok
          </label>
          <input
            type="text"
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Tanggal Kadaluarsa
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate ? dayjs(formData.expiryDate).format('YYYY-MM-DD') : ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            {isEditing ? 'Perbarui Bahan' : 'Tambah Bahan'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Nama
              </th>
              <th scope="col" className="px-6 py-3">
                Kategori
              </th>
              <th scope="col" className="px-6 py-3">
                Stok
              </th>
              <th scope="col" className="px-6 py-3">
                Satuan
              </th>
              <th scope="col" className="px-6 py-3">
                Stok Minimum
              </th>
              <th scope="col" className="px-6 py-3">
                Harga/Unit
              </th>
              <th scope="col" className="px-6 py-3">
                Kadaluarsa
              </th>
              <th scope="col" className="px-6 py-3">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map(material => (
              <tr 
                key={material._id} 
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100"
              >
                <td className="px-6 py-4">{material.name}</td>
                <td className="px-6 py-4">{material.category}</td>
                <td className="px-6 py-4">{material.quantity}</td>
                <td className="px-6 py-4">{material.unit}</td>
                <td className="px-6 py-4">{material.minimumStock}</td>
                <td className="px-6 py-4">{material.costPerUnit}</td>
                <td className="px-6 py-4">
                  {material.expiryDate 
                    ? dayjs(material.expiryDate).format('DD/MM/YYYY') 
                    : '-'}
                </td>
                <td className="px-6 py-4 flex space-x-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(material._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RawMaterialPage;