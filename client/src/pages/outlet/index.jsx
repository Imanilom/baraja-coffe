import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../../firebase";

const OutletManagementPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    contactNumber: "",
    latitude: "",
    longitude: "",
    manager: "",
    outletPictures: [],
  });
  const [images, setImages] = useState([]);
  const [imagePercent, setImagePercent] = useState([]);
  const [imageError, setImageError] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await axios.get("/api/outlet");
      setOutlets(response.data || []);
    } catch (error) {
      console.error("Error fetching outlets:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleFileUpload = async (image, index) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + image.name;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, image);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImagePercent((prev) => {
          const newPercent = [...prev];
          newPercent[index] = Math.round(progress);
          return newPercent;
        });
      },
      (error) => {
        setImageError(true);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev) => ({
          ...prev,
          outletPictures: [...prev.outletPictures, downloadURL],
        }));
      }
    );
  };

  useEffect(() => {
    images.forEach((image, index) => handleFileUpload(image, index));
  }, [images]);

  const handleCreateOutlet = async () => {
    try {
      const response = await axios.post("/api/outlet", formData);
      alert(response.data.message);
      fetchOutlets();
    } catch (error) {
      alert("Error creating outlet.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-semibold">Outlet Management</h2>
      </div>
      <div className="overflow-x-auto shadow-md border rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Address</th>
              <th className="px-6 py-3">Manager</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Image</th>
            </tr>
          </thead>
          <tbody>
            {outlets.map((outlet) => (
              <tr key={outlet._id} className="bg-white border-b">
                <td className="px-6 py-4">{outlet.name}</td>
                <td className="px-6 py-4">{outlet.city}</td>
                <td className="px-6 py-4">{outlet.address}</td>
                <td className="px-6 py-4">{outlet.manager?.name || "N/A"}</td>
                <td className="px-6 py-4">{outlet.contactNumber}</td>
                <td className="px-6 py-4">
                  {outlet.outletPictures.length > 0 && (
                    <img
                      src={outlet.outletPictures[0]}
                      alt="Outlet"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <h3 className="text-2xl font-semibold">Create New Outlet</h3>
        <form onSubmit={(e) => { e.preventDefault(); handleCreateOutlet(); }} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Outlet Name" className="px-4 py-2 border rounded-md" required />
          <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" className="px-4 py-2 border rounded-md" />
          <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Address" className="px-4 py-2 border rounded-md" />
          <input type="text" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="Contact Number" className="px-4 py-2 border rounded-md" />
          <input type="text" name="manager" value={formData.manager} onChange={handleInputChange} placeholder="Manager ID" className="px-4 py-2 border rounded-md" />
          <input type="file" ref={fileRef} multiple accept="image/*" onChange={handleImageChange} className="px-4 py-2 border rounded-md" />
          <button type="submit" className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md">Create Outlet</button>
        </form>
      </div>
    </div>
  );
};

export default OutletManagementPage;
