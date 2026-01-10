import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const confirmModalBulkDelete = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    message = "Apakah Anda yakin?",
    confirmText = "Ya",
    cancelText = "Batal",
    confirmButtonClass = "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-scaleIn">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full">
                        <FaExclamationTriangle className="text-red-600 text-3xl" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                    {message}
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default confirmModalBulkDelete;