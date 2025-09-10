import React, { useState, useEffect } from "react";
import { FaTrashAlt } from "react-icons/fa";

const AddonForm = ({ addons, setAddons }) => {
    const [localAddons, setLocalAddons] = useState([
        {
            name: "",
            options: [{ label: "", price: 0, isDefault: false }],
        },
    ]);

    // 🚀 Sinkronkan props 'addons' ke local state saat mount
    useEffect(() => {
        if (addons && addons.length > 0) {
            setLocalAddons(addons);
        }
    }, [addons]);

    const handleAddonChange = (index, field, value) => {
        const updatedAddons = [...localAddons];
        updatedAddons[index][field] = value;
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const handleOptionChange = (addonIndex, optionIndex, field, value) => {
        const updatedAddons = [...localAddons];
        updatedAddons[addonIndex].options[optionIndex][field] =
            field === "price" ? parseInt(value) || 0 : value;
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const addAddonGroup = () => {
        const updatedAddons = [
            ...localAddons,
            { name: "", options: [{ label: "", price: 0, isDefault: false }] },
        ];
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const removeAddonGroup = (addonIndex) => {
        const updatedAddons = localAddons.filter((_, i) => i !== addonIndex);
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const removeAllAddons = () => {
        setLocalAddons([]);
        setAddons([]);
    };

    const addOption = (addonIndex) => {
        const updatedAddons = [...localAddons];
        updatedAddons[addonIndex].options.push({
            label: "",
            price: 0,
            isDefault: false,
        });
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const removeOption = (addonIndex, optionIndex) => {
        const updatedAddons = [...localAddons];
        updatedAddons[addonIndex].options.splice(optionIndex, 1);
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    return (
        <div className="space-y-5">
            <label className="block font-semibold text-gray-700 text-sm">Addon</label>

            {localAddons.map((addon, addonIndex) => (
                <div key={addonIndex} className="border rounded-xl p-5 shadow-sm bg-white space-y-4">
                    {/* Header Addon */}
                    <div>
                        <input
                            type="text"
                            value={addon.name}
                            onChange={(e) =>
                                handleAddonChange(addonIndex, "name", e.target.value)
                            }
                            className="w-full border px-3 py-2 rounded-md text-sm focus:ring-1 outline-none focus:ring-[#005429] focus:border-[#005429]"
                            placeholder="Contoh: Ukuran, Topping, Level Pedas..."
                        />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {addon.options.map((option, optionIndex) => (
                            <div
                                key={optionIndex}
                                className="flex items-center gap-3"
                            >
                                <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) =>
                                        handleOptionChange(addonIndex, optionIndex, "label", e.target.value)
                                    }
                                    className="border px-3 py-2 rounded-md text-sm flex-1 focus:ring-1 outline-none focus:ring-[#005429] focus:border-[#005429]"
                                    placeholder="Nama Opsi (Contoh: Kecil, Sedang, Besar)"
                                />
                                <input
                                    type="number"
                                    value={option.price}
                                    onChange={(e) =>
                                        handleOptionChange(addonIndex, optionIndex, "price", e.target.value)
                                    }
                                    className="border px-3 py-2 rounded-md text-sm w-40 focus:ring-1 outline-none focus:ring-[#005429] focus:border-[#005429]"
                                    placeholder="Harga (Rp)"
                                />
                                <label className="text-sm flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={option.isDefault}
                                        onChange={(e) =>
                                            handleOptionChange(addonIndex, optionIndex, "isDefault", e.target.checked)
                                        }
                                        className="h-4 w-4 text-[#005429] focus:ring-[#005429] border-gray-300 rounded"
                                    />
                                    Default
                                </label>
                                {addon.options.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(addonIndex, optionIndex)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FaTrashAlt size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Tambah Opsi */}
                    <button
                        type="button"
                        onClick={() => addOption(addonIndex)}
                        className="mt-2 inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-blue-50 text-[#005429] hover:bg-blue-100"
                    >
                        + Tambah
                    </button>

                    {/* Hapus Addon */}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => removeAddonGroup(addonIndex)}
                            className="mt-3 inline-flex items-center text-red-600 hover:text-red-800 text-sm"
                        >
                            <FaTrashAlt className="mr-1" /> Hapus Addon
                        </button>
                    </div>
                </div>
            ))}

            {/* Action bawah */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={addAddonGroup}
                    className="inline-flex items-center px-4 py-2 rounded-md bg-[#005429] text-white text-sm font-medium hover:bg-green-700"
                >
                    + Tambah Addon
                </button>
                {localAddons.length > 0 && (
                    <button
                        type="button"
                        onClick={removeAllAddons}
                        className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                    >
                        Hapus Semua
                    </button>
                )}
            </div>
        </div>

    );
};

export default AddonForm;
