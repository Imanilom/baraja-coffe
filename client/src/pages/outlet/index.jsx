import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../../firebase";  // Import your Firebase app initialization

const OutletManagementPage = () => {
  const [outlets, setOutlets] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contactNumber: "",
    latitude: "",
    longitude: "",
    outletPictures: [],  // Store multiple pictures in an array
  });
  const [images, setImages] = useState([]);  // Track selected images
  const [imagePercent, setImagePercent] = useState([]); // Progress for each image
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const files = e.target.files;
    setImages(Array.from(files));
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
        setImagePercent((prevPercent) => {
          const newPercent = [...prevPercent];
          newPercent[index] = Math.round(progress);
          return newPercent;
        });
      },
      (error) => {
        setImageError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData((prevData) => ({
            ...prevData,
            outletPictures: [...prevData.outletPictures, downloadURL],  // Add new image URL to the array
          }));
        });
      }
    );
  };

  useEffect(() => {
    if (images.length > 0) {
      images.forEach((image, index) => {
        handleFileUpload(image, index);
      });
    }
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

  const handleDeleteOutlet = async (id) => {
    try {
      const response = await axios.delete(`/api/outlet/${id}`);
      alert(response.data.message);
      fetchOutlets();
    } catch (error) {
      alert("Error deleting outlet.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-3xl font-semibold">Outlet Management</h2>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => navigate("/create-outlet")}
        >
          Create Outlet
        </button>
      </div>

      <div className="overflow-x-auto shadow-md border-b border-gray-200 rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {outlets.map((outlet) => (
              <tr key={outlet._id} className="bg-white border-b">
                <td className="px-6 py-4">{outlet.name}</td>
                <td className="px-6 py-4">{outlet.address}</td>
                <td className="px-6 py-4">{outlet.contactNumber}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDeleteOutlet(outlet._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-2xl font-semibold">Create New Outlet</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateOutlet();
          }}
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Outlet Name"
            className="px-4 py-2 border rounded-md"
            required
          />
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Location"
            className="px-4 py-2 border rounded-md"
          />
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            placeholder="Contact Number"
            className="px-4 py-2 border rounded-md"
          />
          <input
            type="number"
            name="latitude"
            value={formData.latitude}
            onChange={handleInputChange}
            placeholder="Latitude"
            className="px-4 py-2 border rounded-md"
            required
          />
          <input
            type="number"
            name="longitude"
            value={formData.longitude}
            onChange={handleInputChange}
            placeholder="Longitude"
            className="px-4 py-2 border rounded-md"
            required
          />
          
          {/* Image upload section */}
          <input
            type="file"
            ref={fileRef}
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="px-4 py-2 border rounded-md"
          />
          {imagePercent.length > 0 && imagePercent.map((percent, index) => (
            <div key={index}>
              <p>Uploading image {index + 1}: {percent}%</p>
            </div>
          ))}
          {imageError && <p className="text-red-500">Error uploading images</p>}

          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-md"
          >
            Create Outlet
          </button>
        </form>
      </div>
    </div>
  );
};

export default OutletManagementPage;
