import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useNavigate, useParams } from 'react-router-dom';
import { handleFileUpload } from '../../components/firebaseUpload'; // Adjust the import path as necessary

const EditProductForm = () => {
  const { id } = useParams(); // Get product ID from URL
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState('');
  const [productPictureFile, setProductPictureFile] = useState(null);
  const [productBannerFile, setProductBannerFile] = useState(null);
  const [customizationOptions, setCustomizationOptions] = useState([{ key: '', values: [''] }]);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');

  const [productPicturePercent, setProductPicturePercent] = useState(0);
  const [productBannerPercent, setProductBannerPercent] = useState(0);
  const [productPictureError, setProductPictureError] = useState(false);
  const [productBannerError, setProductBannerError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/product/${id}`);
        const product = await response.json();
       
        // Check if product data is defined and set defaults to avoid undefined values
        setName(product.product.name || '');
        setCategory((product.product.category || []).join(','));
        setDescription(product.product.description || '');
        setPrice(product.product.price || '');
        setDiscount(product.product.discount || 0);
        setStock(product.product.stock || '');
        setCustomizationOptions(
          (product.product.customizationOptions || []).map(option => ({
            key: option.option || '',
            values: option.values || ['']
          }))
        );
      } catch (error) {
        setModalMessage('Error fetching product details');
        setModalType('error');
        setIsModalOpen(true);
      }
    };

    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let productPictureURL = '';
      let productBannerURL = '';

      if (productPictureFile) {
        productPictureURL = await handleFileUpload(productPictureFile, setProductPicturePercent, setProductPictureError);
      }

      if (productBannerFile) {
        productBannerURL = await handleFileUpload(productBannerFile, setProductBannerPercent, setProductBannerError);
      }

      const productData = {
        name,
        category: category.split(',').map(cat => cat.trim()),
        description,
        price,
        discount,
        stock,
        productPicture: productPictureURL || '',
        productBanner: productBannerURL || '',
        customizationOptions: customizationOptions.map((option) => ({
          option: option.key,
          values: option.values.filter((value) => value.trim() !== ''),
        })),
      };

      const response = await fetch(`/api/product/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        setModalMessage('Product updated successfully!');
        setModalType('success');
        navigate('/product');
      } else {
        const error = await response.json();
        setModalMessage('Error updating product: ' + error.message);
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

  const handleProductPictureChange = (e) => {
    setProductPictureFile(e.target.files[0]);
  };

  const handleProductBannerChange = (e) => {
    setProductBannerFile(e.target.files[0]);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Edit Product</h2>
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

          <div className="flex flex-col">
            <label htmlFor="productPicture" className="text-sm font-medium">Product Picture</label>
            <input
              id="productPicture"
              type="file"
              onChange={handleProductPictureChange}
              className="p-2 border border-gray-300 rounded-md"
            />
            {productPicturePercent > 0 && productPicturePercent < 100 && (
              <p className="text-gray-500">Uploading product picture: {productPicturePercent}%</p>
            )}
            {productPictureError && (
              <p className="text-red-500">Error uploading product picture</p>
            )}
          </div>

          <div className="flex flex-col">
            <label htmlFor="productBanner" className="text-sm font-medium">Product Banner</label>
            <input
              id="productBanner"
              type="file"
              onChange={handleProductBannerChange}
              className="p-2 border border-gray-300 rounded-md"
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
            Save Changes
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

export default EditProductForm;