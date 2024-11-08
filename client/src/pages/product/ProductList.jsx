import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [productToDelete, setProductToDelete] = useState(null); // Product selected for deletion
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); // Modal for delete confirmation

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/product');
        const data = await response.json();

        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const confirmDelete = (product) => {
    setProductToDelete(product); // Store product to delete
    setIsConfirmDeleteOpen(true); // Open confirmation modal
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const response = await fetch(`/api/product/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModalMessage('Product deleted successfully!');
        setModalType('success');
        setProducts(products.filter(product => product._id !== productToDelete._id));
      } else {
        const error = await response.json();
        setModalMessage('Error deleting product: ' + error.message);
        setModalType('error');
      }
      setIsModalOpen(true); // Show success or error modal
    } catch (error) {
      setModalMessage('An unexpected error occurred.');
      setModalType('error');
      setIsModalOpen(true); // Show error modal
    } finally {
      setIsConfirmDeleteOpen(false); // Close confirmation modal
      setProductToDelete(null); // Reset productToDelete state
    }
  };

  const handleEdit = (product) => {
    navigate(`/edit-product/${product._id}`);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalMessage('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-semibold mb-4">Product List</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length > 0 ? (
          products.map(product => (
            <div key={product._id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src={product.productPicture} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-lg text-green-600">${product.price.toFixed(2)}</p>
                <button
                  className="mt-2 bg-blue-500 text-white p-2 rounded-md"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="mt-2 ml-2 bg-red-500 text-white p-2 rounded-md"
                  onClick={() => confirmDelete(product)}
                >
                  Delete
                </button>
                <button
                  className="mt-2 ml-2 bg-gray-300 text-black p-2 rounded-md"
                  onClick={() => handleViewDetails(product)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No products found.</p>
        )}
      </div>

      {/* Modal for displaying product details or notifications */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        message={modalMessage}
        type={modalType}
      >
        {/* If no message, display product details */}
        {selectedProduct && !modalMessage && (
          <div className="p-4">
            <h3 className="text-2xl font-semibold">{selectedProduct.name}</h3>
            <img src={selectedProduct.productBanner} alt={selectedProduct.name} className="w-full h-48 object-cover mb-4" />
            <p className="mb-4">{selectedProduct.description}</p>
            <p className="text-lg text-green-600">Price: ${selectedProduct.price.toFixed(2)}</p>
            <p className="text-lg">Stock: {selectedProduct.stock}</p>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal for Deleting Product */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        message={`Are you sure you want to delete ${productToDelete?.name}?`}
        type="error"
      >
        <div className="mt-6 text-right">
          <button
            onClick={() => setIsConfirmDeleteOpen(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700 mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;
