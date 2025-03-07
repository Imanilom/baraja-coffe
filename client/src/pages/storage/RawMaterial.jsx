import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RawMaterialPage = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    unit: '',
    minimumStock: '',
    supplier: '',
  });
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch raw materials
  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get('/api/storage/raw-material');
      setRawMaterials(response.data.data || []);
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
    }
  };
  
  

  useEffect(() => {
    fetchRawMaterials();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: '', quantity: '', unit: '', minimumStock: '', supplier: '' });
    setIsEditing(false);
    setEditId(null);
  };

  // Handle create or update
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
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save raw material');
    }
  };

  // Handle edit
  const handleEdit = (material) => {
    setFormData(material);
    setIsEditing(true);
    setEditId(material._id);
  };

  // Handle delete with confirmation
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Raw Material Management</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-md shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded-md" required />
          <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="border p-2 rounded-md" required />
          <input type="text" name="unit" value={formData.unit} onChange={handleChange} placeholder="Unit" className="border p-2 rounded-md" required />
          <input type="number" name="minimumStock" value={formData.minimumStock} onChange={handleChange} placeholder="Minimum Stock" className="border p-2 rounded-md" required />
          <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} placeholder="Supplier" className="border p-2 rounded-md" />
        </div>
        <div className="flex gap-2 mt-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
            {isEditing ? 'Update Material' : 'Add Material'}
          </button>
          {isEditing && (
            <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded-md">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        {rawMaterials.length === 0 ? (
          <p className="text-gray-500">No raw materials available</p>
        ) : (
          <table className="table-auto w-full border-collapse border border-gray-200">
            <thead>
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Unit</th>
                <th className="border p-2">Minimum Stock</th>
                <th className="border p-2">Supplier</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rawMaterials.map((material) => (
                <tr key={material._id} className="hover:bg-gray-100">
                  <td className="border p-2">{material.name}</td>
                  <td className="border p-2">{material.quantity}</td>
                  <td className="border p-2">{material.unit}</td>
                  <td className="border p-2">{material.minimumStock}</td>
                  <td className="border p-2">{material.supplier || 'N/A'}</td>
                  <td className="border p-2">
                    <button onClick={() => handleEdit(material)} className="bg-yellow-500 text-white px-2 py-1 rounded-md mr-2">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(material._id)} className="bg-red-500 text-white px-2 py-1 rounded-md">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RawMaterialPage;
