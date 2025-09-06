import React, { useState } from "react";
import { FaTrash } from 'react-icons/fa';

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-md text-center w-96">
                <FaTrash className="text-red-500 mx-auto mb-4" size={72} />
                <h2 className="text-lg font-bold">Konfirmasi Penghapusan</h2>
                <p>Apakah Anda yakin ingin menghapus item ini?</p>
                <div className="flex justify-center mt-4">
                    <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-300 rounded">Batal</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white rounded">Hapus</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;  