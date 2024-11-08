import React from 'react';

const Modal = ({ isOpen, onClose, message, type, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {type ? (type === 'success' ? 'Success' : 'Error') : 'Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        <div className="mt-4">
          {message ? <p>{message}</p> : children} 
          {/* If message exists, show it; otherwise render children (product details) */}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
