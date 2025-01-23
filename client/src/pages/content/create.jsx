import React, { useState, useRef } from "react";
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "../../firebase"; // Import your Firebase app initialization
import axios from "axios";

const CreateContent = () => {
  const [formData, setFormData] = useState({
    type: "banner",
    imageUrls: [],
    description: "",
    createdBy: "",
    startDate: "",
    endDate: "",
  });
  const [images, setImages] = useState([]);
  const [imagePercent, setImagePercent] = useState([]);
  const fileRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const files = e.target.files;
    setImages(Array.from(files));
  };

  const handleFileUpload = async (image, index) => {
    const storage = getStorage(app);
    const fileName = `${new Date().getTime()}_${image.name}`;
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
        console.error("Upload failed:", error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, downloadURL],
        }));
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/contents", formData);
      alert("Content created successfully!");
      setFormData({
        type: "banner",
        imageUrls: [],
        description: "",
        createdBy: "",
        startDate: "",
        endDate: "",
      });
      setImages([]);
      setImagePercent([]);
    } catch (error) {
      console.error("Failed to create content:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Content</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-2">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full border rounded p-2"
            >
              <option value="banner">Banner</option>
              <option value="promo">Promo</option>
              <option value="voucher">Voucher</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border rounded p-2"
            ></textarea>
          </div>
          <div>
            <label className="block font-medium mb-2">Created By</label>
            <input
              type="text"
              name="createdBy"
              value={formData.createdBy}
              onChange={handleInputChange}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-2">Images</label>
            <input
              type="file"
              multiple
              ref={fileRef}
              onChange={handleImageChange}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {images.length > 0 &&
          images.map((image, index) => (
            <div key={index} className="mt-2">
              <p>{image.name}</p>
              <progress value={imagePercent[index] || 0} max="100"></progress>
            </div>
          ))}

        <button
          type="button"
          onClick={() => {
            images.forEach((image, index) => handleFileUpload(image, index));
          }}
          className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Upload Images
        </button>

        <button
          type="submit"
          className="mt-4 ml-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default CreateContent;
