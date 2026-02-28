import React from "react";
import { FaPlus, FaTrashAlt } from "react-icons/fa";

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
        <div>
            <label className="text-xs block font-medium after:content-[''] after:text-red-500 after:text-lg after:ml-1 uppercase">Topping</label>
            <div className="py-4 overflow-y-auto grow">
                {toppings.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start mb-4">

                        <label className="col-span-6 font-medium">Nama Topping</label>
                        <label className="col-span-5 font-medium">Harga</label>
                        <div className="col-span-1"></div>

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
                        className="mt-2 inline-flex items-center text-sm px-3 py-1.5 rounded-md bg-green-900 text-white gap-2"
                    >
                        <FaPlus /> Tambah
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToppingForm;



