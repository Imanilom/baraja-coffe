import { useState, useEffect } from "react";
import axios from "axios";

const RawMaterialPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [categories, setCategories] = useState([]);
  const [datein, setDatein] = useState("");
  const [notes, setNotes] = useState("");
  const [materials, setMaterials] = useState([
    {
      name: "",
      category: "",
      quantity: 0,
      unit: "",
      minimumStock: 0,
      maximumStock: 0,
      costPerUnit: 0,
      supplier: "",
      expiryDate: "",
    },
  ]);
  const [message, setMessage] = useState("");

  const handleMaterialChange = (index, key, value) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index][key] = value;
    setMaterials(updatedMaterials);
  };

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        name: "",
        category: "",
        quantity: 0,
        unit: "",
        minimumStock: 0,
        maximumStock: 0,
        costPerUnit: 0,
        supplier: "",
        expiryDate: "",
      },
    ]);
  };

  const removeMaterial = (index) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const fetchOutlets = async () => {
    try {
      const response = await axios.get("/api/outlet");
      setOutlets(response.data || []);
      if (response.data.length > 0) {
        setSelectedOutlet(response.data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/storage/category");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedOutlet ||
      !datein ||
      materials.some(
        (m) =>
          m.name === "" ||
          m.category === "" ||
          m.quantity <= 0 ||
          m.unit === "" ||
          m.costPerUnit <= 0 ||
          m.supplier === "" ||
          m.expiryDate === ""
      )
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      const response = await axios.post("/api/storage/stock/batch", {
        outletId: selectedOutlet._id,
        datein,
        notes,
        materials,
      });

      setMessage(response.data.message || "Data submitted successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error submitting data.");
    }
  };

  useEffect(() => {
    fetchOutlets();
    fetchCategories();
  }, []);

  return (
    <div className="max-w-8xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Batch Insert Stock</h2>
      {message && (
        <div
          className={`bg-${message.includes("Error") ? "red" : "green"
            }-100 text-${message.includes("Error") ? "red" : "green"}-700 p-2 rounded mb-4`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium text-gray-700">Outlet</label>
          <select
            value={selectedOutlet?.name || ""}
            onChange={(e) => {
              const selectedName = e.target.value;
              const outlet = outlets.find((o) => o.name === selectedName);
              setSelectedOutlet(outlet);
            }}
            className="w-full p-2 border rounded"
            required
          >
            <option value="" disabled hidden>
              Select an outlet...
            </option>
            {outlets.map((outlet) => (
              <option key={outlet._id} value={outlet.name}>
                {outlet.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Tanggal Masuk</label>
          <input
            type="date"
            value={datein}
            onChange={(e) => setDatein(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium text-gray-700">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        <div>
          <label className="block font-medium text-gray-700">Material</label>
          {materials.map((material, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 mb-4 items-end bg-gray-50 p-4 rounded"
            >
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nama</label>
                <input
                  type="text"
                  value={material.name}
                  onChange={(e) => handleMaterialChange(index, "name", e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Kategori</label>
                <select
                  value={material.category}
                  onChange={(e) => handleMaterialChange(index, "category", e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled hidden>
                    Select a Category...
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Qty</label>
                <input
                  type="number"
                  value={material.quantity}
                  onChange={(e) => handleMaterialChange(index, "quantity", e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <input
                  type="text"
                  value={material.unit}
                  onChange={(e) => handleMaterialChange(index, "unit", e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Min</label>
                <input
                  type="number"
                  value={material.minimumStock}
                  onChange={(e) =>
                    handleMaterialChange(index, "minimumStock", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Max</label>
                <input
                  type="number"
                  value={material.maximumStock}
                  onChange={(e) =>
                    handleMaterialChange(index, "maximumStock", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Cost</label>
                <input
                  type="number"
                  value={material.costPerUnit}
                  onChange={(e) =>
                    handleMaterialChange(index, "costPerUnit", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <input
                  type="text"
                  value={material.supplier}
                  onChange={(e) =>
                    handleMaterialChange(index, "supplier", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">Expiry</label>
                <input
                  type="date"
                  value={material.expiryDate}
                  onChange={(e) =>
                    handleMaterialChange(index, "expiryDate", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMaterial}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tambah Material
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Simpan Data
        </button>
      </form>
    </div>
  );
};

export default RawMaterialPage;
