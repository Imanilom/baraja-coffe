import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { FaBell, FaChevronRight, FaClipboardList, FaIdBadge, FaInfoCircle, FaUser, FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const CreateEmployee = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [outlets, setOutlets] = useState([]);
    const [search, setSearch] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [selectedOutlets, setSelectedOutlets] = useState([]);
    const [employeeType, setEmployeeType] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {

            // Fetch outlets data
            const outletsResponse = await axios.get('/api/outlet');

            // Ensure outletsResponse.data is an array
            const outletsData = Array.isArray(outletsResponse.data) ?
                outletsResponse.data :
                (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                    outletsResponse.data.data : [];

            setOutlets(outletsData);

            setError(null);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again later.");
            setFilteredData([]);
            setOutlets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const filteredOutlets = outlets.filter((outlet) =>
        outlet.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectAll = () => {
        if (!selectAll) {
            setSelectedOutlets(filteredOutlets.map((outlet) => outlet._id));
        } else {
            setSelectedOutlets([]);
        }
        setSelectAll(!selectAll);
    };

    const toggleOutlet = (_id) => {
        if (selectedOutlets.includes(_id)) {
            setSelectedOutlets(selectedOutlets.filter((outletId) => outletId !== _id));
        } else {
            setSelectedOutlets([...selectedOutlets, _id]);
        }
    };

    const handleEmployeeSelect = (type) => {
        setEmployeeType(type);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };



    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005429]"></div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold mb-2">Error</p>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6">
            <form className="space-y-6 mb-[60px]" autoComplete="off">
                {/* Breadcrumb */}
                <div className="flex justify-between items-center py-3 my-3">
                    <div className="flex gap-2 items-center text-xl text-green-900 font-semibold">
                        <Link to="/admin/employee">Karyawan</Link>
                        <FaChevronRight />
                        <span>Tambah karyawan</span>
                    </div>
                    <div className="flex space-x-2">
                        <Link to="/admin/employee" className="bg-white border border-[#005429] text-[#005429] text-[13px] px-[15px] py-[7px] rounded hover:bg-[#005429] hover:border-[#005429] hover:text-white">Batal</Link>
                        <button type="submit" className="bg-[#005429] border-[#005429] text-white text-[13px] px-[15px] py-[7px] rounded">Simpan</button>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl gap-4 flex">
                    <div className='w-1/3'>
                        <div className="grid grid-rows-3 gap-4">
                            <div
                                onClick={() => handleEmployeeSelect('cashier')}
                                className={`cursor-pointer p-4 border rounded ${employeeType === 'cashier' ? 'bg-[#005429] border-[#005249] text-white' : 'bg-white'}`}
                            >
                                <h4 className="font-bold">WAITER</h4>
                                <p className="text-sm mt-2">
                                    Karyawan ini bertugas sebagai pramusaji, mereka hanya mendapatkan hak akses di aplikasi kasir.
                                </p>
                            </div>
                            <div
                                onClick={() => handleEmployeeSelect('gro')}
                                className={`cursor-pointer p-4 border rounded ${employeeType === 'gro' ? 'bg-[#005429] border-[#005249] text-white' : 'bg-white'}`}
                            >
                                <h4 className="font-bold">GRO</h4>
                                <p className="text-sm mt-2">
                                    Karyawan ini bertugas sebagai kasir atau pramusaji, mereka hanya mendapatkan hak akses di aplikasi kasir.
                                </p>
                            </div>
                            <div
                                onClick={() => handleEmployeeSelect('staff')}
                                className={`cursor-pointer p-4 border rounded ${employeeType === 'staff' ? 'bg-[#005429] border-[#005249] text-white' : 'bg-white'}`}
                            >
                                <h4 className="font-bold">STAFF / MANAJER</h4>
                                <p className="text-sm mt-2">
                                    Dapat mengakses aplikasi kasir dan backend untuk manajemen data.
                                </p>
                            </div>
                        </div>
                    </div>

                    {employeeType && (
                        <div className="w-2/3 space-y-4 bg-white p-4">
                            <div className="flex space-x-8">
                                <div className="w-1/2 space-y-4">
                                    <div>
                                        <label className="block text-[12px] font-medium uppercase mb-4">Nama</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="mt-1 block text-[12px] w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#005429] focus:border-[#005429]"
                                        />
                                    </div>

                                    {employeeType === 'staff' && (
                                        <div>
                                            <label className="block text-[12px] font-medium uppercase mb-4">Email</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="mt-1 block text-[12px] w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#005429] focus:border-[#005429]"
                                            />
                                        </div>
                                    )}
                                    {employeeType === 'staff' && (
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="block text-[12px] font-medium uppercase">Super Admin</label>
                                            <div className="flex space-x-2">
                                                <h3>Tidak</h3>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" />
                                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1 peer-focus:ring-[#005429] 
                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                    peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
                    after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                    after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full space-y-4">
                                <label className="text-[12px] font-semibold mb-4 uppercase">Outlet</label>
                                <div className="border rounded shadow p-4">
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Cari Outlet"
                                            value={search}
                                            onChange={handleSearchChange}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#005429] focus:border-[#005429]"
                                        />
                                    </div>
                                    <table className="w-full table-auto text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2">
                                                    <div className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectAll}
                                                            onChange={handleSelectAll}
                                                            className="form-checkbox h-4 w-4 text-green-600"
                                                        />
                                                        <span>Semua Outlet</span>
                                                    </div>
                                                </th>
                                                <th className="text-right py-2">
                                                    <button className="text-sm px-3 py-1 border rounded hover:bg-gray-100">Hak Akses Global</button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOutlets.map((outlet) => (
                                                <tr key={outlet._id} className="border-b hover:bg-gray-50">
                                                    <td className="py-2">
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedOutlets.includes(outlet._id)}
                                                                onChange={() => toggleOutlet(outlet._id)}
                                                                className="form-checkbox h-4 w-4 text-green-600"
                                                            />
                                                            <span>{outlet.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        <button className="text-sm px-3 py-1 border rounded hover:bg-gray-100">
                                                            Hak Akses
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CreateEmployee;
