import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
      <img src={product.imgSrc} alt={product.title} className="w-full h-40 object-cover rounded" />
      <h2 className="text-lg font-semibold mt-2">{product.title}</h2>
      <p className="text-gray-600 mt-1">{product.description}</p>
      <p className="text-green-600 font-bold mt-2">{product.price} IDR</p>
    </div>
  );
};

export default ProductCard;