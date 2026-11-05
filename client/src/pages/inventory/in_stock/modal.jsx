import React from 'react';
import { Link } from 'react-router-dom';

const Modal = ({ show, onClose, onSubmit }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-xl rounded shadow-lg p-6 relative animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="text-lg font-semibold">Impor Stok Masuk</h2>
                    <button className="text-[#999999] hover:text-gray-500 text-[20px]" onClick={onClose}>×</button>
                </div>

                {/* Body */}
                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Pilih Outlet */}
                    <div>
                        <label className="text-sm text-gray-600 mb-1 block">1. Pilih Outlet</label>
                        <select className="w-full border px-3 py-2 rounded text-sm">
                            <option value="">- Pilih Outlet -</option>
                            <option value="367667">Baraja Amphiteater</option>
                            <option value="367704">Baraja Coffee TP</option>
                        </select>
                    </div>

                    {/* Upload File */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">2. Pilih file XLS yang sudah Anda input data</label>
                        <input type="file" className="w-full border px-3 py-2 rounded text-sm" />
                    </div>

                    {/* Tanggal */}
                    <div>
                        <label className="text-sm text-gray-600 block mb-1">3. Tanggal</label>
                        <input type="date" className="w-full border px-3 py-2 rounded text-sm" />
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between pt-4 border-t">
                        <div className="text-[12px] w-[310px]">
                            <p>Belum pernah melakukan impor stok masuk? Pelajari cara impor stok masuk <Link className="font-semibold">disini</Link></p>
                        </div>
                        <div className="flex space-x-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-100">
                                Batal
                            </button>
                            <button type="submit" className="px-4 py-2 text-sm bg-[#005429] text-white rounded">
                                Impor
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Modal;
