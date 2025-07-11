// import React, { useState } from "react";
// import { FaTrashAlt } from "react-icons/fa";

// const OpsiModal = ({ isOpen, onClose }) => {
//     const [formData, setFormData] = useState({
//         name: "",
//         hasBahanBaku: false,
//     });

//     const [options, setOptions] = useState([
//         { opsi: "", price: "" }
//     ]);

//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prev) => ({
//             ...prev,
//             [name]: value,
//         }));
//     };

//     const handleOptionChange = (index, field, value) => {
//         const updatedOptions = [...options];
//         updatedOptions[index][field] = value;
//         setOptions(updatedOptions);
//     };

//     const addOption = () => {
//         setOptions([...options, { opsi: "", price: "" }]);
//     };

//     const removeOption = (index) => {
//         const updatedOptions = [...options];
//         updatedOptions.splice(index, 1);
//         setOptions(updatedOptions);
//     };

//     const handleCheckboxToggle = () => {
//         setFormData(prev => ({
//             ...prev,
//             hasBahanBaku: !prev.hasBahanBaku
//         }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         const payload = {
//             ...formData,
//             options: options,
//         };
//         console.log("Kirim data:", payload);
//         onClose(); // tutup modal setelah simpan
//     };

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 z-50 flex justify-end text-[14px]">
//             {/* Overlay */}
//             <div
//                 className="absolute inset-0 bg-black bg-opacity-40"
//                 onClick={onClose}
//             ></div>

//             {/* Modal */}
//             <div className="relative w-full max-w-3xl bg-white shadow-lg h-full flex flex-col animate-slide-in-right">
//                 {/* Header */}
//                 <div className="flex justify-between items-center p-2 border-b shrink-0">
//                     <h4 className="font-semibold uppercase">Tambah Opsi Tambahan</h4>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-500 hover:text-gray-700 text-2xl"
//                     >
//                         &times;
//                     </button>
//                 </div>

//                 {/* Form */}
//                 <form className="mb-[60px]" onSubmit={handleSubmit}>
//                     <div className="flex p-12 space-x-4 overflow-auto">
//                         <div className="w-full">
//                             {/* Nama Grup */}
//                             <div className="mb-4">
//                                 <strong className="block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5 text-[14px]">
//                                     Nama Grup Opsi Tambahan
//                                 </strong>
//                                 <input
//                                     type="text"
//                                     name="name"
//                                     value={formData.name}
//                                     onChange={handleInputChange}
//                                     className="w-full py-2 px-3 border rounded-lg"
//                                     required
//                                 />
//                             </div>

//                             {options.map((opt, index) => (
//                                 <div className="flex space-x-4 mb-4 items-end" key={index}>
//                                     <div className="w-3/4">
//                                         <strong className="block text-[#999999] text-[14px] mb-1 after:content-['*'] after:text-red-500 after:ml-1">
//                                             Nama Opsi Tambahan
//                                         </strong>
//                                         <input
//                                             type="text"
//                                             value={opt.opsi}
//                                             onChange={(e) =>
//                                                 handleOptionChange(index, "opsi", e.target.value)
//                                             }
//                                             className="w-full py-2 px-3 border rounded-lg"
//                                             required
//                                         />
//                                     </div>
//                                     <div className="w-1/4">
//                                         <strong className="block text-[#999999] text-[14px] mb-1">
//                                             Harga
//                                         </strong>
//                                         <input
//                                             type="number"
//                                             value={opt.price}
//                                             onChange={(e) =>
//                                                 handleOptionChange(index, "price", e.target.value)
//                                             }
//                                             className="w-full py-2 px-3 border rounded-lg"
//                                             required
//                                         />
//                                     </div>
//                                     <button
//                                         type="button"
//                                         onClick={() => removeOption(index)}
//                                         className="text-red-500 mb-[8px]" // Tambah margin-top untuk sejajar dengan input bawah
//                                     >
//                                         <FaTrashAlt size={21} />
//                                     </button>
//                                 </div>
//                             ))}

//                             <button
//                                 type="button"
//                                 onClick={addOption}
//                                 className="text-[#005249] mb-4"
//                             >
//                                 + Tambah Opsi Lain
//                             </button>

//                             {/* Bahan Baku */}
//                             <div className="flex justify-between items-center mt-4">
//                                 <span>
//                                     <strong className="text-[#999999] text-[14px] block mb-1">Bahan Baku</strong>
//                                     <p>Apakah opsi tambahan ini memiliki bahan baku?</p>
//                                 </span>
//                                 <div className="flex items-center space-x-2">
//                                     <span className="text-sm">Tidak</span>
//                                     <label className="relative inline-flex items-center cursor-pointer">
//                                         <input
//                                             type="checkbox"
//                                             className="sr-only peer"
//                                             checked={formData.hasBahanBaku}
//                                             onChange={handleCheckboxToggle}
//                                         />
//                                         <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 
//                                                 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
//                                                 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
//                                                 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
//                                                 after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
//                                     </label>
//                                     <span className="text-sm">Ya</span>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Footer Buttons */}
//                     <div className="fixed bottom-0 right-0 bg-white p-4 border-t w-full max-w-3xl">
//                         <div className="flex space-x-2 justify-end">
//                             <button type="button"
//                                 onClick={onClose}
//                                 className="border border-[#005429] text-[#005429] hover:bg-[#005429] hover:text-white text-sm px-3 py-1.5 rounded cursor-pointer"
//                             >
//                                 Batal
//                             </button>
//                             <button
//                                 type="submit"
//                                 className="bg-[#005429] text-white text-sm px-3 py-1.5 rounded"
//                             >
//                                 Simpan
//                             </button>
//                         </div>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default OpsiModal;

// FormOpsi.jsx
// import React, { useState } from "react";
// import { FaTrashAlt } from "react-icons/fa";

// const FormOpsi = ({
//     formData,
//     options,
//     handleInputChange,
//     handleOptionChange,
//     removeOption,
//     addOption,
// }) => {
//     const [ischeck, setIscheck] = useState("");
//     return (
//         <div className="flex space-x-4 overflow-auto mt-4 p-2">
//             <div className="w-full">
//                 {/* Nama Grup */}
//                 <div className="mb-4">
//                     <strong className="block text-[#999999] after:content-['*'] after:text-red-500 after:text-lg after:ml-1 mb-2.5 text-[14px]">
//                         Nama Grup Opsi Tambahan
//                     </strong>
//                     <input
//                         type="text"
//                         name="name"
//                         value={formData.name}
//                         onChange={handleInputChange}
//                         className="w-full py-2 px-3 border rounded-lg"
//                         required
//                     />
//                 </div>

//                 {options.map((opt, index) => (
//                     <div className="flex space-x-4 mb-4 items-end" key={index}>
//                         <div className="w-3/4">
//                             <strong className="block text-[#999999] text-[14px] mb-1 after:content-['*'] after:text-red-500 after:ml-1">
//                                 Nama Opsi Tambahan
//                             </strong>
//                             <input
//                                 type="text"
//                                 value={opt.opsi}
//                                 onChange={(e) =>
//                                     handleOptionChange(index, "opsi", e.target.value)
//                                 }
//                                 className="w-full py-2 px-3 border rounded-lg"
//                                 required
//                             />
//                         </div>
//                         <div className="w-1/4">
//                             <strong className="block text-[#999999] text-[14px] mb-1">
//                                 Harga
//                             </strong>
//                             <input
//                                 type="number"
//                                 value={opt.price}
//                                 onChange={(e) =>
//                                     handleOptionChange(index, "price", e.target.value)
//                                 }
//                                 className="w-full py-2 px-3 border rounded-lg"
//                                 required
//                             />
//                         </div>
//                         <button
//                             type="button"
//                             onClick={() => removeOption(index)}
//                             className="text-red-500 mb-[8px]"
//                         >
//                             <FaTrashAlt size={21} />
//                         </button>
//                     </div>
//                 ))}

//                 <button
//                     type="button"
//                     onClick={addOption}
//                     className="text-[#005249] mb-4"
//                 >
//                     + Tambah Opsi Lain
//                 </button>

//                 {/* Bahan Baku */}
//                 <div className="flex justify-between items-center mt-4">
//                     <span>
//                         <strong className="text-[#999999] text-[14px] block mb-1">
//                             Bahan Baku
//                         </strong>
//                         <p>Apakah opsi tambahan ini memiliki bahan baku?</p>
//                     </span>
//                     <div className="flex items-center space-x-2">
//                         <span className="text-sm">
//                             {ischeck ? "Ya" : "Tidak"}
//                         </span>
//                         <label className="relative inline-flex items-center cursor-pointer">
//                             <input
//                                 type="checkbox"
//                                 className="sr-only peer"
//                                 checked={ischeck}
//                                 onChange={(e) => setIscheck(e.target.checked)}
//                             />
//                             <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:ring-1 peer-focus:ring-blue-300 
//                 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
//                 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 
//                 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
//                 after:h-5 after:w-5 after:transition-all peer-checked:bg-[#005429]"></div>
//                         </label>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default FormOpsi;
import React, { useState, useEffect } from "react";
import { FaTrashAlt } from "react-icons/fa";

const AddonForm = ({ addons, setAddons }) => {
    const [localAddons, setLocalAddons] = useState([
        {
            name: "",
            options: [{ label: "", price: 0, isDefault: false }],
        },
    ]);

    // Update parent every time localAddons change
    useEffect(() => {
        setAddons(localAddons);
    }, [localAddons, setAddons]);

    const handleAddonNameChange = (index, value) => {
        const updated = [...localAddons];
        updated[index].name = value;
        setLocalAddons(updated);
    };

    const handleOptionChange = (addonIndex, optionIndex, field, value) => {
        const updated = [...localAddons];
        updated[addonIndex].options[optionIndex][field] =
            field === "price" ? parseInt(value) : field === "isDefault" ? value : value;
        setLocalAddons(updated);
    };

    const addOption = (addonIndex) => {
        const updated = [...localAddons];
        updated[addonIndex].options.push({ label: "", price: 0, isDefault: false });
        setLocalAddons(updated);
    };

    const removeOption = (addonIndex, optionIndex) => {
        const updated = [...localAddons];
        updated[addonIndex].options.splice(optionIndex, 1);
        setLocalAddons(updated);
    };

    const addAddonGroup = () => {
        setLocalAddons([
            ...localAddons,
            { name: "", options: [{ label: "", price: 0, isDefault: false }] },
        ]);
    };

    const removeAddonGroup = (index) => {
        const updated = [...localAddons];
        updated.splice(index, 1);
        setLocalAddons(updated);
    };

    return (
        <div className="">
            <h3 className="font-semibold mb-2">Addons</h3>

            {localAddons.map((addon, index) => (
                <div key={index} className="p-4 border mb-6">
                    {/* Nama Grup */}
                    <div className="mb-4">
                        <h3 className="font-semibold text-[#999999] text-sm mb-2">
                            Nama Grup Opsi Tambahan
                        </h3>
                        <input
                            type="text"
                            value={addon.name}
                            onChange={(e) => handleAddonNameChange(index, e.target.value)}
                            placeholder="Contoh: Ukuran"
                            className="w-full py-2 px-3 border rounded-lg"
                            required
                        />
                    </div>

                    {/* Options */}
                    {addon.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-end space-x-4 mb-3">
                            <div className="w-1/2">
                                <label className="text-sm font-semibold text-[#999999] mb-1 block">
                                    Nama Opsi Tambahan
                                </label>
                                <input
                                    type="text"
                                    value={opt.label}
                                    onChange={(e) =>
                                        handleOptionChange(index, optIdx, "label", e.target.value)
                                    }
                                    className="w-full py-2 px-3 border rounded-lg"
                                    required
                                />
                            </div>

                            <div className="w-1/4">
                                <label className="text-sm font-semibold text-[#999999] mb-1 block">Harga</label>
                                <input
                                    type="number"
                                    value={opt.price}
                                    onChange={(e) =>
                                        handleOptionChange(index, optIdx, "price", e.target.value)
                                    }
                                    className="w-full py-2 px-3 border rounded-lg"
                                    required
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <label className="text-sm text-[#999999]">Default</label>
                                <input
                                    type="checkbox"
                                    checked={opt.isDefault}
                                    onChange={(e) =>
                                        handleOptionChange(index, optIdx, "isDefault", e.target.checked)
                                    }
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeOption(index, optIdx)}
                                className="text-red-500"
                            >
                                <FaTrashAlt size={21} />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => addOption(index)}
                        className="text-[#005249] text-sm mt-2"
                    >
                        + Tambah Opsi Lain
                    </button>

                    {localAddons.length > 1 && (
                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={() => removeAddonGroup(index)}
                                className="text-red-500 text-sm"
                            >
                                Hapus Grup Ini
                            </button>
                        </div>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={addAddonGroup}
                className="text-blue-600 hover:underline"
            >
                + Tambah Grup Addon
            </button>
        </div>
    );
};

export default AddonForm;



