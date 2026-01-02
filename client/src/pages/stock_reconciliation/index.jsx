import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';

const StockReconciliation = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');
    const [selectedDate, setSelectedDate] = useState('2025-11-06');

    // Data dummy makanan dan minuman dengan tanggal
    const [stockData] = useState([
        // Data 2025-11-06
        {
            id: 1,
            sku: 'MKN-001',
            name: 'Nasi Goreng Special',
            category: 'Makanan',
            systemStock: 50,
            physicalStock: 47,
            unit: 'Porsi',
            location: 'Kitchen Station 1',
            date: '2025-11-06'
        },
        {
            id: 2,
            sku: 'MNM-001',
            name: 'Es Teh Manis',
            category: 'Minuman',
            systemStock: 100,
            physicalStock: 105,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-06'
        },
        {
            id: 3,
            sku: 'MKN-002',
            name: 'Ayam Bakar',
            category: 'Makanan',
            systemStock: 35,
            physicalStock: 35,
            unit: 'Porsi',
            location: 'Kitchen Station 2',
            date: '2025-11-06'
        },
        {
            id: 4,
            sku: 'MNM-002',
            name: 'Jus Jeruk Fresh',
            category: 'Minuman',
            systemStock: 45,
            physicalStock: 42,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-06'
        },
        {
            id: 5,
            sku: 'MKN-003',
            name: 'Mie Goreng Seafood',
            category: 'Makanan',
            systemStock: 40,
            physicalStock: 43,
            unit: 'Porsi',
            location: 'Kitchen Station 1',
            date: '2025-11-06'
        },
        {
            id: 6,
            sku: 'MNM-003',
            name: 'Kopi Susu',
            category: 'Minuman',
            systemStock: 80,
            physicalStock: 75,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-06'
        },
        // Data 2025-11-05
        {
            id: 7,
            sku: 'MKN-001',
            name: 'Nasi Goreng Special',
            category: 'Makanan',
            systemStock: 55,
            physicalStock: 53,
            unit: 'Porsi',
            location: 'Kitchen Station 1',
            date: '2025-11-05'
        },
        {
            id: 8,
            sku: 'MNM-001',
            name: 'Es Teh Manis',
            category: 'Minuman',
            systemStock: 110,
            physicalStock: 110,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-05'
        },
        {
            id: 9,
            sku: 'MKN-002',
            name: 'Ayam Bakar',
            category: 'Makanan',
            systemStock: 40,
            physicalStock: 38,
            unit: 'Porsi',
            location: 'Kitchen Station 2',
            date: '2025-11-05'
        },
        {
            id: 10,
            sku: 'MNM-002',
            name: 'Jus Jeruk Fresh',
            category: 'Minuman',
            systemStock: 50,
            physicalStock: 52,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-05'
        },
        // Data 2025-11-04
        {
            id: 11,
            sku: 'MKN-001',
            name: 'Nasi Goreng Special',
            category: 'Makanan',
            systemStock: 48,
            physicalStock: 48,
            unit: 'Porsi',
            location: 'Kitchen Station 1',
            date: '2025-11-04'
        },
        {
            id: 12,
            sku: 'MNM-001',
            name: 'Es Teh Manis',
            category: 'Minuman',
            systemStock: 95,
            physicalStock: 90,
            unit: 'Cup',
            location: 'Beverage Station',
            date: '2025-11-04'
        },
        {
            id: 13,
            sku: 'MKN-004',
            name: 'Sate Ayam',
            category: 'Makanan',
            systemStock: 60,
            physicalStock: 65,
            unit: 'Porsi',
            location: 'Kitchen Station 3',
            date: '2025-11-04'
        }
    ]);

    const calculateVariance = (system, physical) => {
        return physical - system;
    };

    const getVarianceStatus = (variance) => {
        if (variance === 0) return 'match';
        if (variance > 0) return 'surplus';
        return 'shortage';
    };

    // Filter berdasarkan tanggal
    const dataByDate = stockData.filter(item => item.date === selectedDate);

    const filteredData = dataByDate.filter(item => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());

        if (selectedTab === 'all') return matchesSearch;

        const variance = calculateVariance(item.systemStock, item.physicalStock);
        const status = getVarianceStatus(variance);

        return matchesSearch && status === selectedTab;
    });

    const stats = {
        total: dataByDate.length,
        match: dataByDate.filter(item => calculateVariance(item.systemStock, item.physicalStock) === 0).length,
        shortage: dataByDate.filter(item => calculateVariance(item.systemStock, item.physicalStock) < 0).length,
        surplus: dataByDate.filter(item => calculateVariance(item.systemStock, item.physicalStock) > 0).length
    };

    // Get unique dates for dropdown
    const uniqueDates = [...new Set(stockData.map(item => item.date))].sort().reverse();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Rekonsiliasi Stok F&B</h1>
                    <p className="text-gray-600">Perbandingan stok sistem dengan stok fisik workstation - Makanan & Minuman</p>
                </div>

                {/* Date Filter */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700">Filter Tanggal:</label>
                        <select
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {uniqueDates.map(date => (
                                <option key={date} value={date}>
                                    {new Date(date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Item</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Search className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Sesuai</p>
                                <p className="text-2xl font-bold text-green-600">{stats.match}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Kurang</p>
                                <p className="text-2xl font-bold text-red-600">{stats.shortage}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <ArrowDownCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Lebih</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.surplus}</p>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <ArrowUpCircle className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="p-4">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan nama atau SKU..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setSelectedTab('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedTab === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Semua ({stats.total})
                            </button>
                            <button
                                onClick={() => setSelectedTab('match')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedTab === 'match'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Sesuai ({stats.match})
                            </button>
                            <button
                                onClick={() => setSelectedTab('shortage')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedTab === 'shortage'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Kurang ({stats.shortage})
                            </button>
                            <button
                                onClick={() => setSelectedTab('surplus')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedTab === 'surplus'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Lebih ({stats.surplus})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Item</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workstation</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Sistem</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Fisik</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Selisih</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredData.map((item) => {
                                    const variance = calculateVariance(item.systemStock, item.physicalStock);
                                    const status = getVarianceStatus(variance);

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.sku}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.category === 'Makanan'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {item.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                                                {item.systemStock} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                                                {item.physicalStock} {item.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`font-bold ${variance === 0 ? 'text-gray-600' :
                                                        variance > 0 ? 'text-orange-600' : 'text-red-600'
                                                    }`}>
                                                    {variance > 0 ? '+' : ''}{variance} {item.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {status === 'match' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Sesuai
                                                    </span>
                                                )}
                                                {status === 'shortage' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <ArrowDownCircle className="w-4 h-4 mr-1" />
                                                        Kurang
                                                    </span>
                                                )}
                                                {status === 'surplus' && (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                        <ArrowUpCircle className="w-4 h-4 mr-1" />
                                                        Lebih
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredData.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-8 text-center mt-6">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Tidak ada data yang ditemukan untuk tanggal ini</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockReconciliation;