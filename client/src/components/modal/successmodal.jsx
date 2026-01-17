import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const SuccessModal = ({
    isOpen,
    onClose,
    title = "Berhasil!",
    message = "Operasi berhasil dilakukan.",
    buttonText = "Tutup",
    autoClose = true,
    autoCloseDelay = 3000
}) => {
    React.useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, autoCloseDelay);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, autoCloseDelay, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-scaleIn">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-100 p-4 rounded-full animate-bounce">
                        <FaCheckCircle className="text-green-600 text-4xl" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    {title}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                    {message}
                </p>
                {!autoClose && (
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuccessModal;