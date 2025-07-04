import React from "react";

const DetailMejaModal = ({ isOpen, onClose, data = {} }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-40"
                onClick={onClose}
            />

            {/* Sidebar Modal */}
            <div className="ml-auto w-full max-w-sm h-full bg-white shadow-lg animate-slideInRight relative flex flex-col">
                {/* Header */}
                <div className="border-b px-5 py-2 flex justify-between items-center">
                    <h4 className="text-[14px] font-semibold">DETAIL MEJA</h4>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                        ×
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    <form className="space-y-4 text-[14px]">
                        {[
                            { label: "Nama Meja", name: "tableName" },
                            { label: "Nama Area", name: "areaName" },
                            { label: "Status Area", name: "areaStatus" },
                            { label: "Batas Waktu", name: "timeLimit" },
                            { label: "Waktu Pengingat", name: "reminderTime" },
                        ].map((field, idx) => (
                            <div key={idx} className="flex items-center">
                                <label className="w-1/3 text-sm text-gray-700">
                                    {field.label}
                                </label>
                                <div className="w-2/3">
                                    <input
                                        type="text"
                                        name={field.name}
                                        value={data[field.name] || ""}
                                        disabled
                                        className="w-full px-3 py-2 border rounded text-sm bg-gray-100 text-gray-700"
                                    />
                                </div>
                            </div>
                        ))}
                    </form>
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-[#005429] hover:bg-[#006d34] text-white text-sm py-2 px-4 rounded"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailMejaModal;
