import axios from 'axios';
import React, { useEffect, useState } from 'react';

const Modal = ({ show, onClose, onSubmit }) => {
    if (!show) return null;
    const [outlets, setOutlets] = useState([]);
    // Fetch attendances and outlets data
    useEffect(() => {
        const fetchData = async () => {
            try {

                // Fetch outlets data
                const outletsResponse = await axios.get('/api/outlet');

                // Ensure outletsResponse.data is an array
                const outletsData = Array.isArray(outletsResponse.data) ?
                    outletsResponse.data :
                    (outletsResponse.data && Array.isArray(outletsResponse.data.data)) ?
                        outletsResponse.data.data : [];

                setOutlets(outletsData);
            } catch (err) {
                console.error("Error fetching data:", err);
                setOutlets([]);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="relative bg-white rounded shadow-lg w-full max-w-lg max-h-[400px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="text-lg font-semibold">Impor Opname Stok</h2>
                    <button className="text-[#999999] hover:text-gray-500 text-[20px]" onClick={onClose}>×</button>
                </div>

                {/* Body scrollable */}
                <div className="px-6 py-4 overflow-y-auto flex-1">
                    <form onSubmit={onSubmit} className="space-y-4"> {/* Padding bawah supaya isi tak tertutup footer */}
                        {/* 1. Pilih Outlet */}
                        <div>
                            <label className="text-sm text-gray-600 mb-1 block">1. Pilih Outlet Pengirim</label>
                            <select className="w-full border px-3 py-2 rounded text-sm">
                                <option value="">- Pilih Outlet -</option>
                                {outlets.map((outlet, idx) => (
                                    <option key={idx} value={outlet.id}>{outlet.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Upload File */}
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">2. Pilih file XLS yang sudah Anda input data</label>
                            <input type="file" className="w-full border px-3 py-2 rounded text-sm" />
                        </div>
                    </form>
                </div>

                {/* Footer fixed */}
                <div className="px-6 py-4 border-t bg-white sticky bottom-0 z-10">
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm border rounded hover:bg-gray-100"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="form-id-jika-ada"
                            className="px-4 py-2 text-sm bg-[#005429] text-white rounded "
                        >
                            Impor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
