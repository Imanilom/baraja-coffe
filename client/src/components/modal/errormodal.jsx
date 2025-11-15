import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const ErrorModal = ({
    isOpen,
    onClose,
    title = "Gagal",
    message = "Terjadi kesalahan. Silakan coba lagi.",
    buttonText = "Tutup",
    showCloseButton = true
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-scaleIn">
                {showCloseButton && (
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                )}
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full animate-shake">
                        <FaExclamationTriangle className="text-red-600 text-3xl" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};

export default ErrorModal;