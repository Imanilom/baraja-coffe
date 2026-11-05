import React, { useState } from "react";
import { FaInfoCircle, FaTrash } from 'react-icons/fa';

const ConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white relative p-4 max-w-3xl h-[300px] rounded shadow-md text-center">
                <h1 className="mx-auto mb-8 pt-6">
                    <div className="text-[40px] w-[80px] h-[80px] text-[#005429] border-2 border-[#005429] rounded-full flex items-center justify-center mx-auto">
                        i
                    </div>
                </h1>
                <h2 className="text-lg font-bold text-[#999999]">Apakah Anda ingin meninggalkan halaman ini?</h2>
                <p className="text-[#999999]">Perubahan data pada form akan hilang.</p>
                <div className="absolute bottom-4 right-4">
                    <button onClick={onClose} className="mr-2 px-4 py-2 text-[#005429] border border-[#005429] rounded">Batal</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-[#005429] text-white rounded">Yakin</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;  