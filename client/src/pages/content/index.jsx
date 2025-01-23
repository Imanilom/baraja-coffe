import React, { useEffect, useState } from "react";
import axios from "axios";

const ContentIndex = () => {
  const [contents, setContents] = useState([]);
  const [formData, setFormData] = useState({
    type: "banner",
    imageUrls: [],
    description: "",
    createdBy: "",
    startDate: "",
    endDate: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await axios.get("/api/contents");
      setContents(response.data);
    } catch (error) {
      console.error("Failed to fetch contents:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/api/content/${editId}`, formData);
      } else {
        await axios.post("/api/content", formData);
      }
      setFormData({
        type: "banner",
        imageUrls: [],
        description: "",
        createdBy: "",
        startDate: "",
        endDate: "",
      });
      setIsEditing(false);
      fetchContents();
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  };

  const handleEdit = (content) => {
    setIsEditing(true);
    setEditId(content._id);
    setFormData({
      type: content.type,
      imageUrls: content.imageUrls.join(", "),
      description: content.description,
      createdBy: content.createdBy,
      startDate: content.startDate.split("T")[0],
      endDate: content.endDate.split("T")[0],
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/content/${id}`);
      fetchContents();
    } catch (error) {
      console.error("Failed to delete content:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Content Management</h1>
        <a href="/content-create" className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create content</a>
      <table className="mt-4 w-full bg-white shadow rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-4">Type</th>
            <th className="p-4">Description</th>
            <th className="p-4">Created By</th>
            <th className="p-4">Dates</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contents.map((content) => (
            <tr key={content._id} className="border-b">
              <td className="p-4">{content.type}</td>
              <td className="p-4">{content.description}</td>
              <td className="p-4">{content.createdBy}</td>
              <td className="p-4">
                {content.startDate.split("T")[0]} -{" "}
                {content.endDate.split("T")[0]}
              </td>
              <td className="p-4">
                <button
                  onClick={() => handleEdit(content)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(content._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContentIndex;
