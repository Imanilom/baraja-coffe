import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaTrash, FaBox, FaShopware, FaPencilAlt } from 'react-icons/fa';
import UnderDevelopment from '../../components/repair';

const AssetManagement = () => {
    const [assets, setAssets] = useState([]);
    const [filteredAssets, setFilteredAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'other',
        description: '',
        quantity: 1,
        unit: 'pcs',
        price: 0,
        currency: 'IDR',
        warehouse: '',
        isActive: true
    });

    // Fetch assets
    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/assets');
            const data = await response.json();
            setAssets(data.data);
            setFilteredAssets(data.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch assets');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Filter assets
    useEffect(() => {
        let filtered = assets;

        if (searchTerm) {
            filtered = filtered.filter(asset =>
                asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                asset.code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterCategory !== 'all') {
            filtered = filtered.filter(asset => asset.category === filterCategory);
        }

        setFilteredAssets(filtered);
    }, [searchTerm, filterCategory, assets]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Handle form change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Open modal for add/edit
    const openModal = (asset = null) => {
        if (asset) {
            setEditMode(true);
            setCurrentAsset(asset);
            setFormData({
                name: asset.name,
                code: asset.code || '',
                category: asset.category,
                description: asset.description || '',
                quantity: asset.quantity,
                unit: asset.unit,
                price: asset.price,
                currency: asset.currency,
                warehouse: asset.warehouse?._id || '',
                isActive: asset.isActive
            });
        } else {
            setEditMode(false);
            setCurrentAsset(null);
            setFormData({
                name: '',
                code: '',
                category: 'other',
                description: '',
                quantity: 1,
                unit: 'pcs',
                price: 0,
                currency: 'IDR',
                warehouse: '',
                isActive: true
            });
        }
        setShowModal(true);
    };

    // Close modal
    const closeModal = () => {
        setShowModal(false);
        setEditMode(false);
        setCurrentAsset(null);
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editMode ? `/api/assets/${currentAsset._id}` : '/api/assets';
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save asset');

            fetchAssets();
            closeModal();
        } catch (err) {
            alert(err.message || 'Failed to save asset');
        }
    };

    // Delete asset
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this asset?')) return;
        try {
            const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete');
            fetchAssets();
        } catch (err) {
            alert('Failed to delete asset');
        }
    };

    const categoryColors = {
        furniture: 'bg-blue-100 text-blue-800',
        tool: 'bg-green-100 text-green-800',
        equipment: 'bg-purple-100 text-purple-800',
        other: 'bg-gray-100 text-gray-800'
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        // <div className="p-6 max-w-7xl mx-auto">
        //     {/* Header */}
        //     <div className="flex justify-between items-center mb-6">
        //         <h1 className="text-3xl font-bold text-gray-800">Asset Management</h1>
        //         <button
        //             onClick={() => openModal()}
        //             className="flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 transition"
        //         >
        //             <FaPlus size={20} /> Add Asset
        //         </button>
        //     </div>

        //     {error && (
        //         <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>
        //     )}

        //     {/* Filters */}
        //     <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        //         <div className="relative">
        //             <FaSearch className="absolute left-3 top-3 text-gray-400" size={18} />
        //             <input
        //                 type="text"
        //                 placeholder="Search by name or code..."
        //                 value={searchTerm}
        //                 onChange={(e) => setSearchTerm(e.target.value)}
        //                 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        //             />
        //         </div>
        //         <select
        //             value={filterCategory}
        //             onChange={(e) => setFilterCategory(e.target.value)}
        //             className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        //         >
        //             <option value="all">All Categories</option>
        //             <option value="furniture">Furniture</option>
        //             <option value="tool">Tool</option>
        //             <option value="equipment">Equipment</option>
        //             <option value="other">Other</option>
        //         </select>
        //     </div>

        //     {/* Assets Grid */}
        //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        //         {filteredAssets.map((asset) => (
        //             <div key={asset._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        //                 <div className="flex justify-between items-start mb-4">
        //                     <div className="flex items-center gap-2">
        //                         <Package className="text-green-900" size={24} />
        //                         <h3 className="font-bold text-lg">{asset.name}</h3>
        //                     </div>
        //                     <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[asset.category]}`}>
        //                         {asset.category}
        //                     </span>
        //                 </div>

        //                 {asset.code && (
        //                     <p className="text-sm text-gray-600 mb-2">Code: {asset.code}</p>
        //                 )}

        //                 {asset.description && (
        //                     <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
        //                 )}

        //                 <div className="space-y-2 mb-4">
        //                     <div className="flex justify-between text-sm">
        //                         <span className="text-gray-600">Quantity:</span>
        //                         <span className="font-medium">{asset.quantity} {asset.unit}</span>
        //                     </div>
        //                     <div className="flex justify-between text-sm">
        //                         <span className="text-gray-600">Price/unit:</span>
        //                         <span className="font-medium">{formatCurrency(asset.price)}</span>
        //                     </div>
        //                     <div className="flex justify-between text-sm font-bold">
        //                         <span className="text-gray-600">Total Value:</span>
        //                         <span className="text-green-900">{formatCurrency(asset.totalValue || asset.quantity * asset.price)}</span>
        //                     </div>
        //                 </div>

        //                 {asset.warehouse && (
        //                     <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pb-4 border-b">
        //                         <FaShopware size={16} />
        //                         <span>{asset.warehouse.name}</span>
        //                     </div>
        //                 )}

        //                 <div className="flex gap-2">
        //                     <button
        //                         onClick={() => openModal(asset)}
        //                         className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
        //                     >
        //                         <FaPencilAlt size={16} /> Edit
        //                     </button>
        //                     <button
        //                         onClick={() => handleDelete(asset._id)}
        //                         className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
        //                     >
        //                         <FaTrash size={16} /> Delete
        //                     </button>
        //                 </div>

        //                 {!asset.isActive && (
        //                     <div className="mt-3 text-center text-xs text-red-600 font-medium">Inactive</div>
        //                 )}
        //             </div>
        //         ))}
        //     </div>

        //     {filteredAssets.length === 0 && (
        //         <div className="text-center py-12 text-gray-500">
        //             <FaBox className="mx-auto mb-4 text-gray-400" size={48} />
        //             <p>No assets found. Add your first asset!</p>
        //         </div>
        //     )}

        //     {/* Modal */}
        //     {showModal && (
        //         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        //             <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        //                 <h2 className="text-2xl font-bold mb-4">
        //                     {editMode ? 'Edit Asset' : 'Add New Asset'}
        //                 </h2>

        //                 <div className="space-y-4">
        //                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Name *</label>
        //                             <input
        //                                 type="text"
        //                                 name="name"
        //                                 value={formData.name}
        //                                 onChange={handleChange}
        //                                 required
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Code</label>
        //                             <input
        //                                 type="text"
        //                                 name="code"
        //                                 value={formData.code}
        //                                 onChange={handleChange}
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Category *</label>
        //                             <select
        //                                 name="category"
        //                                 value={formData.category}
        //                                 onChange={handleChange}
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             >
        //                                 <option value="furniture">Furniture</option>
        //                                 <option value="tool">Tool</option>
        //                                 <option value="equipment">Equipment</option>
        //                                 <option value="other">Other</option>
        //                             </select>
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Warehouse ID *</label>
        //                             <input
        //                                 type="text"
        //                                 name="warehouse"
        //                                 value={formData.warehouse}
        //                                 onChange={handleChange}
        //                                 placeholder="Enter warehouse ID"
        //                                 required
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Quantity *</label>
        //                             <input
        //                                 type="number"
        //                                 name="quantity"
        //                                 value={formData.quantity}
        //                                 onChange={handleChange}
        //                                 min="0"
        //                                 required
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Unit</label>
        //                             <input
        //                                 type="text"
        //                                 name="unit"
        //                                 value={formData.unit}
        //                                 onChange={handleChange}
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Price *</label>
        //                             <input
        //                                 type="number"
        //                                 name="price"
        //                                 value={formData.price}
        //                                 onChange={handleChange}
        //                                 min="0"
        //                                 required
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>

        //                         <div>
        //                             <label className="block text-sm font-medium mb-1">Currency</label>
        //                             <input
        //                                 type="text"
        //                                 name="currency"
        //                                 value={formData.currency}
        //                                 onChange={handleChange}
        //                                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                             />
        //                         </div>
        //                     </div>

        //                     <div>
        //                         <label className="block text-sm font-medium mb-1">Description</label>
        //                         <textarea
        //                             name="description"
        //                             value={formData.description}
        //                             onChange={handleChange}
        //                             rows="3"
        //                             className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        //                         />
        //                     </div>

        //                     <div className="flex items-center gap-2">
        //                         <input
        //                             type="checkbox"
        //                             name="isActive"
        //                             checked={formData.isActive}
        //                             onChange={handleChange}
        //                             className="w-4 h-4"
        //                         />
        //                         <label className="text-sm font-medium">Active</label>
        //                     </div>

        //                     <div className="flex gap-3 pt-4">
        //                         <button
        //                             onClick={handleSubmit}
        //                             className="flex-1 px-4 py-2 bg-green-900 text-white rounded hover:bg-green-800 transition"
        //                         >
        //                             {editMode ? 'Update Asset' : 'Add Asset'}
        //                         </button>
        //                         <button
        //                             onClick={closeModal}
        //                             className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition"
        //                         >
        //                             Cancel
        //                         </button>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //     )}
        // </div>
        <UnderDevelopment />
    );
};

export default AssetManagement;