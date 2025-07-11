// import React, { useState } from "react";
// import { FaTrashAlt } from "react-icons/fa";

// const VariantModal = ({ isOpen, onClose }) => {
//     const [variantGroups, setVariantGroups] = useState([
//         { id: Date.now(), name: "", options: "" }
//     ]);

//     const handleAddRow = () => {
//         setVariantGroups([
//             ...variantGroups,
//             { id: Date.now(), name: "", options: "" }
//         ]);
//     };

//     const handleRemoveRow = (id) => {
//         setVariantGroups((prev) => prev.filter((group) => group.id !== id));
//     };

//     const handleChange = (id, field, value) => {
//         setVariantGroups((prev) =>
//             prev.map((group) =>
//                 group.id === id ? { ...group, [field]: value } : group
//             )
//         );
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
//                     <h4 className="font-semibold">Varian Produk X</h4>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-500 hover:text-gray-700 text-2xl"
//                     >
//                         &times;
//                     </button>
//                 </div>

//                 {/* Body */}
//                 <div className="p-4 overflow-y-auto grow">
//                     <form>
//                         {/* Group Varian Rows */}
//                         {variantGroups.map((group, index) => (
//                             <div
//                                 key={group.id}
//                                 className="grid grid-cols-12 gap-2 items-start mb-4"
//                             >
//                                 {index === 0 && (
//                                     <>
//                                         <label className="col-span-3 font-medium">
//                                             Group Varian
//                                         </label>
//                                         <label className="col-span-8 font-medium">
//                                             Pilihan Varian
//                                         </label>
//                                         <div className="col-span-1"></div>
//                                     </>
//                                 )}

//                                 <div className="col-span-3">
//                                     <input
//                                         type="text"
//                                         className="w-full border rounded px-3 py-2"
//                                         placeholder="Contoh: Ukuran"
//                                         value={group.name}
//                                         onChange={(e) =>
//                                             handleChange(group.id, "name", e.target.value)
//                                         }
//                                     />
//                                 </div>
//                                 <div className="col-span-8">
//                                     <input
//                                         type="text"
//                                         className="w-full border rounded px-3 py-2"
//                                         placeholder="Contoh: S, M, L"
//                                         value={group.options}
//                                         onChange={(e) =>
//                                             handleChange(group.id, "options", e.target.value)
//                                         }
//                                     />
//                                     <p className="text-xs text-gray-500 mt-1">
//                                         Pisahkan dengan koma
//                                     </p>
//                                 </div>
//                                 <div className="col-span-1 flex items-center h-9">
//                                     <button
//                                         type="button"
//                                         onClick={() => handleRemoveRow(group.id)}
//                                         className="text-red-500 hover:text-red-700"
//                                     >
//                                         <FaTrashAlt size={21} />
//                                     </button>
//                                 </div>
//                             </div>
//                         ))}

//                         {/* Button Tambah */}
//                         <div className="mt-2 mb-6">
//                             <button
//                                 type="button"
//                                 onClick={handleAddRow}
//                                 className="text-blue-600 hover:underline"
//                             >
//                                 + Tambah
//                             </button>
//                         </div>
//                     </form>
//                 </div>

//                 {/* Sticky Footer */}
//                 <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-2">
//                     <button
//                         onClick={onClose}
//                         className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
//                     >
//                         Batal
//                     </button>
//                     <button
//                         type="submit"
//                         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                     >
//                         Simpan
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default VariantModal;

import React from "react";
import { FaTrashAlt } from "react-icons/fa";

const ToppingForm = ({ toppings, setToppings }) => {
    const handleChange = (index, field, value) => {
        const updated = [...toppings];
        updated[index][field] = field === "price" ? parseInt(value) : value;
        setToppings(updated);
    };

    const handleAddRow = () => {
        setToppings([...toppings, { name: "", price: 0 }]);
    };

    const handleRemoveRow = (index) => {
        const updated = [...toppings];
        updated.splice(index, 1);
        setToppings(updated);
    };

    return (
        <div className="">
            <h3 className="text-sm font-semibold">Topping</h3>
            <div className="p-4 overflow-y-auto grow">
                {toppings.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start mb-4">
                        {index === 0 && (
                            <>
                                <label className="col-span-6 font-medium">Nama Topping</label>
                                <label className="col-span-5 font-medium">Harga</label>
                                <div className="col-span-1"></div>
                            </>
                        )}

                        <div className="col-span-6">
                            <input
                                type="text"
                                className="w-full border rounded px-3 py-2"
                                placeholder="Contoh: Ayam"
                                value={item.name}
                                onChange={(e) => handleChange(index, "name", e.target.value)}
                            />
                        </div>

                        <div className="col-span-5">
                            <input
                                type="number"
                                className="w-full border rounded px-3 py-2"
                                placeholder="Contoh: 5000"
                                value={item.price}
                                onChange={(e) => handleChange(index, "price", e.target.value)}
                            />
                        </div>

                        <div className="col-span-1 flex items-center h-9">
                            <button
                                type="button"
                                onClick={() => handleRemoveRow(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                <FaTrashAlt size={21} />
                            </button>
                        </div>
                    </div>
                ))}

                <div className="mt-2 mb-6">
                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="text-blue-600 hover:underline"
                    >
                        + Tambah
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToppingForm;



