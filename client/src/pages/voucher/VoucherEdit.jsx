import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../components/Modal';
import { useNavigate, useParams } from 'react-router-dom';
import { handleFileUpload } from '../../components/firebaseUpload';

const EditVoucherForm = () => {
  const { id } = useParams();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [voucherPictureFile, setVoucherPictureFile] = useState(null);
  const [voucherPictureURL, setVoucherPictureURL] = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const response = await fetch(`/api/voucher/${id}`);
        const voucher = await response.json();

        setCode(voucher.voucher.code || '');
        setName(voucher.voucher.name || '');
        setDescription(voucher.voucher.description || '');
        setDiscountAmount(voucher.voucher.discountAmount || '');
        const date = new Date(voucher.voucher.expirationDate);
        const formattedDate = date.toISOString().split('T')[0]; // Get 'yyyy-MM-dd' format
        setExpirationDate(formattedDate);
        setVoucherPictureURL(voucher.voucher.voucherPicture || '');
      } catch (error) {
        setModalMessage('Error fetching voucher details');
        setModalType('error');
        setIsModalOpen(true);
      }
    };

    fetchVoucher();
  }, [id]);

  const handleVoucherPictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVoucherPictureFile(file);
      setVoucherPictureURL(URL.createObjectURL(file)); // Preview the image
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let voucherPictureURLToUpload = '';

      if (voucherPictureFile) {
        voucherPictureURLToUpload = await handleFileUpload(voucherPictureFile);
      }

      const voucherData = {
        code,
        name,
        description,
        discountAmount,
        expirationDate,
        voucherPicture: voucherPictureURLToUpload || voucherPictureURL, // Use existing URL if no new file
      };

      const response = await fetch(`/api/voucher/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(voucherData),
      });

      if (response.ok) {
        setModalMessage('Voucher updated successfully!');
        setModalType('success');
        navigate('/voucher');
      } else {
        const error = await response.json();
        setModalMessage('Error updating voucher: ' + error.message);
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

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Edit Voucher</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label htmlFor="code" className="text-sm font-medium">Voucher Code</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium">Voucher Name</label>
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
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              placeholder="Voucher description"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="discountAmount" className="text-sm font-medium">Discount Amount</label>
            <input
              id="discountAmount"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="expirationDate" className="text-sm font-medium">Expiration Date</label>
            <input
              id="expirationDate"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col mb-4">
            <label htmlFor="voucherPicture" className="text-sm font-medium">Voucher Picture</label>
            <input
              type="file"
              ref={fileRef}
              hidden
              accept="image/*"
              onChange={handleVoucherPictureChange}
            />
            <img
            //   src={voucherPictureURL || '/default-image.jpg'} // Use a default image if none is set
              src={voucherPictureURL} // Use a default image if none is set
              alt="Voucher"
              className="h-24 w-24 self-center cursor-pointer rounded-md object-cover mt-2"
              onClick={() => fileRef.current.click()}
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-md mt-4 w-full"
          >
            Save Changes
          </button>
        </div>
      </form>

      <Modal isOpen={isModalOpen} onClose={closeModal} type={modalType}>
        {modalMessage}
      </Modal>
    </div>
  );
};

export default EditVoucherForm;