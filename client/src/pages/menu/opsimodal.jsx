import React, { useState, useEffect } from "react";

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
        setAddons(updatedAddons); // Update ke parent
    };

    const handleOptionChange = (addonIndex, optionIndex, field, value) => {
        const updatedAddons = [...localAddons];
        updatedAddons[addonIndex].options[optionIndex][field] = field === "price" ? parseInt(value) || 0 : value;
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons); // Update ke parent
    };

    const addAddonGroup = () => {
        const updatedAddons = [
            ...localAddons,
            { name: "", options: [{ label: "", price: 0, isDefault: false }] },
        ];
        setLocalAddons(updatedAddons);
        setAddons(updatedAddons);
    };

    const addOption = (addonIndex) => {
        const updatedAddons = [...localAddons];
        updatedAddons[addonIndex].options.push({ label: "", price: 0, isDefault: false });
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
        <div className="grid gap-4">
            <label className="block mb-1 font-medium text-sm">Addon</label>
            {localAddons.map((addon, addonIndex) => (
                <div key={addonIndex} className="border p-4 rounded-md shadow-sm">
                    <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => handleAddonChange(addonIndex, "name", e.target.value)}
                        className="w-full border px-2 py-1 rounded text-sm"
                        placeholder="Contoh: Ukuran, Tambahan Es, dll"
                    />

                    <div className="mt-3 space-y-3">
                        {addon.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex flex-col-4 gap-2 md:flex-row md:items-center md:gap-3">
                                <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => handleOptionChange(addonIndex, optionIndex, "label", e.target.value)}
                                    className="border px-2 py-1 rounded w-full md:w-1/2 text-sm"
                                    placeholder="Nama Opsi (Contoh: Kecil, Sedang)"
                                />
                                <input
                                    type="number"
                                    value={option.price}
                                    onChange={(e) => handleOptionChange(addonIndex, optionIndex, "price", e.target.value)}
                                    className="border px-2 py-1 rounded w-full md:w-1/4 text-sm"
                                    placeholder="Harga (Rp)"
                                />
                                <label className="text-sm flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={option.isDefault}
                                        onChange={(e) =>
                                            handleOptionChange(addonIndex, optionIndex, "isDefault", e.target.checked)
                                        }
                                    />
                                    Default
                                </label>
                                {addon.options.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(addonIndex, optionIndex)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={() => addOption(addonIndex)}
                        className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                    >
                        + Tambah Opsi
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addAddonGroup}
                className="text-sm text-green-600 hover:text-green-800 font-medium"
            >
                + Tambah Addon
            </button>
        </div>
    );
};

export default AddonForm;
