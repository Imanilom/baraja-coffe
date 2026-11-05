import React from "react";

const ConfirmationModalActive = ({ isOpen, onClose, onConfirm, user, newStatus }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 sm:mx-6 md:mx-auto p-6 animate-fadeIn">
                {/* Header */}
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                    Konfirmasi
                </h2>
                {/* Body */}
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Apakah Anda yakin ingin mengubah status {" "}
                    <span className="font-medium text-gray-800">{user?.username}</span>{" "}
                    menjadi{" "}
                    <span
                        className={`font-semibold ${newStatus ? "text-green-600" : "text-red-500"
                            }`}
                    >
                        {newStatus ? "Aktif" : "Tidak Aktif"}
                    </span>
                    ?
                </p>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-5 py-2 text-sm font-medium rounded-lg text-white 
                   bg-[#005429] hover:bg-[#007a40] 
                   focus:outline-none focus:ring-2 focus:ring-[#00a35c] focus:ring-offset-2 transition">
                        Ya, Ubah
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModalActive;
