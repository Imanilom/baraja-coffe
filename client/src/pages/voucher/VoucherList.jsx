import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../components/Modal';

const VoucherList = () => {
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const [voucherToDelete, setVoucherToDelete] = useState(null); // Voucher selected for deletion
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false); // Modal for delete confirmation

  const navigate = useNavigate();

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch('/api/voucher');
        const data = await response.json();
        setVouchers(data || []);
      } catch (error) {
        console.error('Error fetching vouchers:', error);
        setVouchers([]);
      }
    };
    fetchVouchers();
  }, []);

  const confirmDelete = (voucher) => {
    setVoucherToDelete(voucher); // Store voucher to delete
    setIsConfirmDeleteOpen(true); // Open confirmation modal
  };

  const handleDelete = async () => {
    if (!voucherToDelete) return;
    
    try {
      const response = await fetch(`/api/voucher/${voucherToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModalMessage('Voucher deleted successfully!');
        setModalType('success');
        setVouchers(vouchers.filter(voucher => voucher._id !== voucherToDelete._id));
      } else {
        const error = await response.json();
        setModalMessage('Error deleting voucher: ' + error.message);
        setModalType('error');
      }
      setIsModalOpen(true); // Show success or error modal
    } catch (error) {
      setModalMessage('An unexpected error occurred.');
      setModalType('error');
      setIsModalOpen(true); // Show error modal
    } finally {
      setIsConfirmDeleteOpen(false); // Close confirmation modal
      setVoucherToDelete(null); // Reset voucherToDelete state
    }
  };

  const handleEdit = (voucher) => {
    navigate(`/edit-voucher/${voucher._id}`);
  };

  const handleViewDetails = (voucher) => {
    setSelectedVoucher(voucher);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedVoucher(null);
    setModalMessage('');
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-semibold mb-4">Voucher List</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.length > 0 ? (
          vouchers.map(voucher => (
            <div key={voucher._id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src={voucher.voucherPicture} alt={voucher.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold">{voucher.name}</h3>
                <p className="text-lg text-green-600">Discount: {voucher.discount}%</p>
                <button
                  className="mt-2 bg-blue-500 text-white p-2 rounded-md"
                  onClick={() => handleEdit(voucher)}
                >
                  Edit
                </button>
                <button
                  className="mt-2 ml-2 bg-red-500 text-white p-2 rounded-md"
                  onClick={() => confirmDelete(voucher)}
                >
                  Delete
                </button>
                <button
                  className="mt-2 ml-2 bg-gray-300 text-black p-2 rounded-md"
                  onClick={() => handleViewDetails(voucher)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center">No vouchers found.</p>
        )}
      </div>

      {/* Modal for displaying voucher details or notifications */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        message={modalMessage}
        type={modalType}
      >
        {/* If no message, display voucher details */}
        {selectedVoucher && !modalMessage && (
          <div className="p-4">
            <h3 className="text-2xl font-semibold">{selectedVoucher.name}</h3>
            <img src={selectedVoucher.voucherBanner} alt={selectedVoucher.name} className="w-full h-48 object-cover mb-4" />
            <p className="mb-4">{selectedVoucher.description}</p>
            <p className="text-lg text-green-600">Discount: {selectedVoucher.discount}%</p>
            <p className="text-lg">Code: {selectedVoucher.code}</p>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal for Deleting Voucher */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        message={`Are you sure you want to delete ${voucherToDelete?.name}?`}
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

export default VoucherList;
