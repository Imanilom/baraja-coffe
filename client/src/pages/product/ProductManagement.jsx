import React, { useState, useRef } from 'react';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { handleFileUpload } from '../../components/firebaseUpload'; // Adjust the import path as necessary

const ManageProductForm = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState('');
  const [prodcutPictureFile, setProdcutPictureFile] = useState(null);
  const [productBannerFile, setProductBannerFile] = useState(null);
  const [prodcutPictureURL, setProdcutPictureURL] = useState('');
  const [productBannerURL, setProductBannerURL] = useState('');
  const fileRefProdcut = useRef(null);
  const fileRefBanner = useRef(null);
  const [customizationOptions, setCustomizationOptions] = useState([{ key: '', values: [''] }]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // default to success

  const [prodcutPicturePercent, setProdcutPicturePercent] = useState(0);
  const [productBannerPercent, setProductBannerPercent] = useState(0);
  const [prodcutPictureError, setProdcutPictureError] = useState(false);
  const [productBannerError, setProductBannerError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let prodcutPictureURL = '';
      let productBannerURL = '';

      if (prodcutPictureFile) {
        prodcutPictureURL = await handleFileUpload(prodcutPictureFile, setProdcutPicturePercent, setProdcutPictureError);
      }

      if (productBannerFile) {
        productBannerURL = await handleFileUpload(productBannerFile, setProductBannerPercent, setProductBannerError);
      }

      const productData = {
        name,
        category: category.split(','),
        description,
        price,
        discount,
        stock,
        prodcutPicture: prodcutPictureURL,
        productBanner: productBannerURL,
        customizationOptions: customizationOptions.map((option) => ({
          option: option.key,
          values: option.values.filter((value) => value.trim() !== ''),
        })),
      };

      const response = await fetch('/api/product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setModalMessage('Product created successfully!');
        setModalType('success');
        navigate('/');
      } else {
        const error = await response.json();
        setModalMessage('Error creating product: ' + error.message);
        setModalType('error');
      }
      setIsModalOpen(true);
    } catch (error) {
      setModalMessage('An unexpected error occurred.');
      setModalType('error');
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCustomizationChange = (index, type, value, valueIndex = null) => {
    const updatedCustomization = [...customizationOptions];
    if (type === 'key') {
      updatedCustomization[index].key = value;
    } else if (type === 'value') {
      updatedCustomization[index].values[valueIndex] = value;
    }
    setCustomizationOptions(updatedCustomization);
  };

  const addCustomizationOption = () => {
    setCustomizationOptions([...customizationOptions, { key: '', values: [''] }]);
  };

  const addValueToOption = (index) => {
    const updatedCustomization = [...customizationOptions];
    updatedCustomization[index].values.push('');
    setCustomizationOptions(updatedCustomization);
  };

  const removeValueFromOption = (index, valueIndex) => {
    const updatedCustomization = [...customizationOptions];
    updatedCustomization[index].values.splice(valueIndex, 1);
    setCustomizationOptions(updatedCustomization);
  };

  const removeCustomizationOption = (index) => {
    const updatedCustomization = [...customizationOptions];
    updatedCustomization.splice(index, 1);
    setCustomizationOptions(updatedCustomization);
  };

  const handleProdcutPictureChange = (e) => {
    const file = e.target.files[0];
    setProdcutPictureFile(file);
    setProdcutPictureURL(URL.createObjectURL(file)); // Preview the image
  };

  const handleProductBannerChange = (e) => {
    const file = e.target.files[0];
    setProductBannerFile(file);
    setProductBannerURL(URL.createObjectURL(file)); // Preview the banner
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Add Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium">Product Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              placeholder="Separate categories with commas"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              placeholder="Product description"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="price" className="text-sm font-medium">Price</label>
            <input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="discount" className="text-sm font-medium">Discount</label>
            <input
              id="discount"
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              min="0"
              max="100"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="stock" className="text-sm font-medium">Stock</label>
            <input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col mb-4">
            <label htmlFor="prodcutPicture" className="text-sm font-medium">Product Picture</label>
            <input
              id="prodcutPicture"
              type="file"
              ref={fileRefProdcut}
              hidden
              accept="image/*"
              onChange={handleProdcutPictureChange}
            />
            <img
              src={prodcutPictureURL || 'https://via.placeholder.com/1200x1200.jpg'}
              alt="Product"
              className="h-36 w-36 self-center cursor-pointer rounded-md object-cover mt-2"
              onClick={() => fileRefProdcut.current.click()}
            />
            {prodcutPicturePercent > 0 && prodcutPicturePercent < 100 && (
              <p className="text-gray-500">Uploading product picture: {prodcutPicturePercent}%</p>
            )}
            {prodcutPictureError && (
              <p className="text-red-500">Error uploading product picture</p>
            )}
          </div>

          <div className="flex flex-col mb-4">
            <label htmlFor="productBanner" className="text-sm font-medium">Product Banner</label>
            <input
              id="productBanner"
              type="file"
              ref={fileRefBanner}
              hidden
              accept="image/*"
              onChange={handleProductBannerChange}
            />
            <img
              src={productBannerURL || 'https://via.placeholder.com/1200x400.jpg'}
              alt="Banner"
              className="w-full h-48 self-center cursor-pointer rounded-md object-cover mt-2"
              onClick={() => fileRefBanner.current.click()}
            />
            {productBannerPercent > 0 && productBannerPercent < 100 && (
              <p className="text-gray-500">Uploading product banner: {productBannerPercent}%</p>
            )}
            {productBannerError && (
              <p className="text-red-500">Error uploading product banner</p>
            )}
          </div>

          {/* Customization Options */}
          {customizationOptions.map((option, index) => (
            <div key={index} className="flex flex-col">
              <label className="text-sm font-medium">Customization Option</label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={option.key}
                  onChange={(e) => handleCustomizationChange(index, 'key', e.target.value)}
                  placeholder="Option name (e.g. suhu)"
                  className="p-2 border border-gray-300 rounded-md"
                />
                {option.values.map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleCustomizationChange(index, 'value', e.target.value, valueIndex)}
                      placeholder="Value (e.g. cold)"
                      className="p-2 border border-gray-300 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeValueFromOption(index, valueIndex)}
                      className="text-red-500"
                    >
                      Remove Value
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addValueToOption(index)}
                  className="text-blue-500"
                >
                  Add Value
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeCustomizationOption(index)}
                className="text-red-500 mt-2"
              >
                Remove Customization Option
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addCustomizationOption}
            className="text-blue-500 mt-4"
          >
            Add Customization Option
          </button>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md mt-4 w-full"
          >
            Add Product
          </button>
        </div>
      </form>

      {/* Modal component */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        message={modalMessage}
        type={modalType}
      />
    </div>
  );
};

export default ManageProductForm;