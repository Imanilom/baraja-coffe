import React from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';

// Delete Confirmation Modal
export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, eventName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-scaleIn">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full animate-pulse">
                        <FaExclamationTriangle className="text-red-600 text-3xl" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    Hapus Event?
                </h3>
                <p className="text-gray-600 text-center mb-6">
                    Apakah Anda yakin ingin menghapus event{' '}
                    <span className="font-semibold text-gray-800">"{eventName}"</span>?
                    <br />
                    <span className="text-sm text-red-500 mt-2 inline-block">
                        Tindakan ini tidak dapat dibatalkan.
                    </span>
                </p>
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Ya, Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success Modal
export const SuccessModal = ({ isOpen, onClose, message = "Event berhasil dihapus!" }) => {
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
                    Berhasil!
                </h3>
                <p className="text-gray-600 text-center mb-4">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
};

// Error Modal
export const ErrorModal = ({ isOpen, onClose, message = "Terjadi kesalahan" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-scaleIn">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-red-100 p-4 rounded-full animate-shake">
                        <FaExclamationTriangle className="text-red-600 text-3xl" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                    Gagal Menghapus
                </h3>
                <p className="text-gray-600 text-center mb-6">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
};

// Demo Component
const ModalDemo = () => {
    const [showDelete, setShowDelete] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [showError, setShowError] = React.useState(false);

    const handleConfirmDelete = () => {
        setShowDelete(false);
        // Simulate API call
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% success rate
            if (success) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setShowError(true);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Modal Components Demo
                </h2>
                <div className="space-y-4">
                    <button
                        onClick={() => setShowDelete(true)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Show Delete Confirmation
                    </button>
                    <button
                        onClick={() => {
                            setShowSuccess(true);
                            setTimeout(() => setShowSuccess(false), 3000);
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Show Success Modal
                    </button>
                    <button
                        onClick={() => setShowError(true)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Show Error Modal
                    </button>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={handleConfirmDelete}
                eventName="Tech Conference 2025"
            />

            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                message="Event berhasil dihapus dari sistem!"
            />

            <ErrorModal
                isOpen={showError}
                onClose={() => setShowError(false)}
                message="Tidak dapat menghapus event. Silakan coba lagi."
            />

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-5px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(5px);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }

                .animate-scaleIn {
                    animation: scaleIn 0.3s ease-out;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default ModalDemo;