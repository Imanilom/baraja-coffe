import { useState, useEffect } from "react";
import axios from "axios";

const RawMaterialPage = () => {
  const [outlets, setOutlets] = useState([]); // List of outlets fetched from API
  const [selectedOutlet, setSelectedOutlet] = useState(null); // Selected outlet object
  const [categories, setCategories] = useState([]); // List of categories fetched from API
  const [selectedCategories, setSelectedCategories] = useState(null); // Selected category object
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

  // Handle input changes for materials
  const handleMaterialChange = (index, key, value) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index][key] = value;
    setMaterials(updatedMaterials);
  };

  // Add a new material row
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

  // Remove a material row
  const removeMaterial = (index) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  // Fetch list of outlets on component mount
  const fetchOutlets = async () => {
    try {
      const response = await axios.get("/api/outlet");
      setOutlets(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedOutlet(response.data[0]); // Set default outlet
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch list of categories on component mount
  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/storage/category/inventory");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  // Submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    // if (
    //   !selectedOutlet ||
    //   !datein ||
    //   materials.some(
    //     (m) =>
    //       m.name === "" ||
    //       m.category === "" ||
    //       m.quantity <= 0 ||
    //       m.unit === "" ||
    //       m.costPerUnit <= 0 ||
    //       m.supplier === "" ||
    //       m.expiryDate === ""
    //   )
    // ) {
    //   setMessage("Please fill in all required fields.");
    //   return;
    // }

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
      // Cetak isi semua data form
      console.log("===== DATA FORM SAAT INI =====");
      console.log("Outlet:", selectedOutlet);
      console.log("Tanggal Masuk:", datein);
      console.log("Catatan:", notes);
      console.log("Daftar Material:");
      materials.forEach((m, i) => {
        console.log(`Material #${i + 1}:`, m);
      });
      console.log("================================");

      // Validasi manual
      if (!selectedOutlet) console.log("❌ Outlet belum dipilih.");
      if (!datein) console.log("❌ Tanggal masuk belum diisi.");

      materials.forEach((m, i) => {
        const errorFields = [];
        if (m.name === "") errorFields.push("nama kosong");
        if (m.category === "") errorFields.push("kategori kosong");
        if (m.quantity <= 0) errorFields.push("jumlah <= 0");
        if (m.unit === "") errorFields.push("satuan kosong");
        if (m.costPerUnit <= 0) errorFields.push("biaya per unit <= 0");
        if (m.supplier === "") errorFields.push("supplier kosong");
        if (m.expiryDate === "") errorFields.push("expired kosong");

        if (errorFields.length > 0) {
          console.log(`❌ Material #${i + 1} bermasalah:`, errorFields);
        }
      });

      setMessage("Please fill in all required fields.");
      return;
    }

    try {
      const response = await axios.post("/api/storage/stock/batch", {
        outletId: selectedOutlet._id, // Send outletId, not name
        datein,
        notes,
        materials,
      });

      setMessage(response.data.message || "Data submitted successfully!");
    } catch (error) {
      setMessage(error.response?.data?.message || "Error submitting data.");
    }
  };

  // Fetch outlets when the component mounts
  useEffect(() => {
    fetchOutlets();
    fetchCategories();
    console.log(categories);
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
        {/* Outlet Selection */}
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

        {/* Date In */}
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

        {/* Notes */}
        <div>
          <label className="block font-medium text-gray-700">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 border rounded"
          ></textarea>
        </div>

        {/* Material List */}
        <div>
          <label className="block font-medium text-gray-700">Material</label>
          {materials.map((material, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 mb-2 items-center"
            >
              {/* Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  value={material.name}
                  onChange={(e) =>
                    handleMaterialChange(index, "name", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Category */}
              <div className="col-span-2">
                <label className="block font-sm font-medium text-gray-700">Kategori</label>
                <select
                  value={selectedCategories?.name || ""}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const category = categories.find((o) => o.name === selectedName);
                    setSelectedCategories(category);
                  }}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled hidden>
                    Select a Category...
                  </option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Qty
                </label>
                <input
                  type="number"
                  value={material.quantity}
                  onChange={(e) =>
                    handleMaterialChange(index, "quantity", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Unit */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Unit
                </label>
                <input
                  type="text"
                  value={material.unit}
                  onChange={(e) =>
                    handleMaterialChange(index, "unit", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Minimum Stock */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Min Stock
                </label>
                <input
                  type="number"
                  value={material.minimumStock}
                  onChange={(e) =>
                    handleMaterialChange(index, "minimumStock", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Maximum Stock */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Max Stock
                </label>
                <input
                  type="number"
                  value={material.maximumStock}
                  onChange={(e) =>
                    handleMaterialChange(index, "maximumStock", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Cost Per Unit */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Harga per Unit
                </label>
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

              {/* Supplier */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Supplier
                </label>
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

              {/* Expiry Date */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Expire Date
                </label>
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

              {/* Remove Button */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="bg-red-500 text-white px-3 py-2 rounded"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addMaterial}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            + Tambah Material
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded w-full"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default RawMaterialPage;