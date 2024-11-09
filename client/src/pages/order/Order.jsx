import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CreateOrderForm = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  const [products, setProducts] = useState([]);
  const [orderProducts, setOrderProducts] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('pickup');

  const [totalPriceBeforeDiscount, setTotalPriceBeforeDiscount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/product', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setModalMessage('Error fetching products. Please try again later.');
        setModalType('error');
        setIsModalOpen(true);
      }
    };

    fetchProducts();
  }, []);

  // Fetch available vouchers from currentUser
  useEffect(() => {
    if (currentUser && currentUser.vouchers) {
      const availableVouchers = currentUser.vouchers.filter(voucher => !voucher.isUsed);
      setVouchers(availableVouchers);
    }
  }, [currentUser]);

  // Calculate total prices whenever orderProducts or selectedVoucher changes
  useEffect(() => {
    let totalBefore = 0;
    orderProducts.forEach(orderProduct => {
      const product = products.find(prod => prod._id === orderProduct.productId);
      if (product) {
        const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
        totalBefore += discountedPrice * orderProduct.quantity;
      }
    });

    setTotalPriceBeforeDiscount(totalBefore);
    const appliedVoucher = vouchers.find(voucher => voucher._id === selectedVoucher);
    const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
    setDiscountAmount(discount);
    const finalTotal = totalBefore - discount;
    setTotalPrice(finalTotal > 0 ? finalTotal : 0);
  }, [orderProducts, selectedVoucher, products, vouchers]);

  const handleAddProduct = (productId) => {
    const existingProduct = orderProducts.find(orderProduct => orderProduct.productId === productId);
    if (existingProduct) {
      const updatedProducts = orderProducts.map(orderProduct => {
        if (orderProduct.productId === productId) {
          return { ...orderProduct, quantity: orderProduct.quantity + 1 };
        }
        return orderProduct;
      });
      setOrderProducts(updatedProducts);
    } else {
      setOrderProducts([...orderProducts, { productId, quantity: 1 }]);
    }
  };

  const handleRemoveProduct = (productId) => {
    const updatedProducts = orderProducts.filter(orderProduct => orderProduct.productId !== productId);
    setOrderProducts(updatedProducts);
  };

  const handleQuantityChange = (productId, increment) => {
    const updatedProducts = orderProducts.map(orderProduct => {
      if (orderProduct.productId === productId) {
        return { ...orderProduct, quantity: Math.max(1, orderProduct.quantity + increment) };
      }
      return orderProduct;
    });
    setOrderProducts(updatedProducts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderData = {
        products: orderProducts,
        customerName,
        types: orderType,
      };

      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();
        setModalMessage('Order created successfully!');
        setModalType('success');
        setIsModalOpen(true);
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      setModalMessage(`Error creating order: IDR {error.message}`);
      setModalType('error');
      setIsModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    (acc[product.category] = acc[product.category] || []).push(product);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-md rounded-md my-8">
      <h2 className="text-2xl font-semibold mb-6">Create New Order</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium mb-1">
            Customer Name
          </label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter customer name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="orderType" className="block text-sm font-medium mb-1">
            Order Type
          </label>
          <select
            id="orderType"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="pickup">Pickup</option>
            <option value="dinein">Dine-In</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {/* Render Products as Cards */}
        <h3 className="text-lg font-medium mb-2">Products</h3>
        <div className="flex flex-col space-y-4">
          {Object.entries(groupedProducts).map(([category, products]) => (
            <div key={category} className="mb-6">
              <h4 className="font-semibold text-lg mb-2 border-b pb-2">{category}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {products.map(product => (
                  <div key={product._id} className="border border-gray-300 mr-5 rounded-md p-4 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                    <img src={product.productPicture} alt={product.name} className="h-32 object-cover mb-2 rounded" />
                    <h5 className="font-bold">{product.name}</h5>
                    <p className="text-gray-600">IDR {product.price.toFixed(2)} {product.discount ? `(Discount: IDR {product.discount}%)` : ''}</p>
                    <div className="flex flex-col items-center mt-auto">
                        <div className="flex items-center mb-2">
                            <button
                            type="button"
                            onClick={() => handleQuantityChange(product._id, -1)}
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-l-md"
                            >
                            -
                            </button>
                            <input
                            type="number"
                            value={orderProducts.find(op => op.productId === product._id)?.quantity || 1}
                            readOnly
                            className="text-center w-12 border border-gray-300"
                            />
                            <button
                            type="button"
                            onClick={() => handleQuantityChange(product._id, 1)}
                            className="bg-gray-200 text-gray-700 px-2 py-1 rounded-r-md"
                            >
                            +
                            </button>
                        </div>

                        <div className="flex items-center">
                            <button
                            type="button"
                            onClick={() => handleAddProduct(product._id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-md mx-1"
                            >
                            Add
                            </button>
                            <button
                            type="button"
                            onClick={() => handleRemoveProduct(product._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-md mx-1"
                            >
                            X
                            </button>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Voucher Selection */}
        {vouchers.length > 0 && (
          <div className="mb-4">
            <label htmlFor="voucher" className="block text-sm font-medium mb-1">
              Apply Voucher
            </label>
            <select
              id="voucher"
              value={selectedVoucher}
              onChange={(e) => setSelectedVoucher(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">No Voucher</option>
              {vouchers.map(voucher => (
                <option key={voucher._id} value={voucher._id}>
                  {voucher.code} - {voucher.name} (IDR {voucher.discountAmount})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Total Price */}
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Total Price</h3>
          <div className="flex justify-between">
            <span>Total Before Discount:</span>
            <span>IDR {totalPriceBeforeDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-IDR {discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>IDR {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-blue-500 text-white p-2 rounded-md IDR {isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
        >
          {isSubmitting ? 'Submitting...' : 'Create Order'}
        </button>
      </form>

      {/* Modal for Success/Error Messages */}
      <Modal isOpen={isModalOpen} onClose={closeModal} type={modalType}>
        {modalMessage}
      </Modal>
    </div>
  );
};

export default CreateOrderForm;