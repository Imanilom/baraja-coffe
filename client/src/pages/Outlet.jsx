import React from 'react';

const stores = [
  {
    name: "Bandung",
    address: "Bandung",
    hours: "08:00 - 22:00",
    image: "https://placehold.co/300x200/png",
    googleMapsLink: "https://www.google.com/maps"
  },
  {
    name: "Bandung",
    address: "Bandung",
    hours: "07:00 - 23:00",
    image: "https://placehold.co/300x200/png",
    googleMapsLink: "https://www.google.com/maps"
  },
  {
    name: "Bandung",
    address: "Bandung",
    hours: "10:00 - 22:00",
    image: "https://placehold.co/300x200/png",
    googleMapsLink: "https://www.google.com/maps"
  },
  {
    name: "Bandung",
    address: "Bandung",
    hours: "10:00 - 22:00",
    image: "https://placehold.co/300x200/png",
    googleMapsLink: "https://www.google.com/maps"
  },
];

const StoreList = () => {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-semibold text-center text-green-700 mb-12">Our Store</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {stores.map((store, index) => (
          <div key={index} className="bg-white shadow-lg rounded-lg overflow-hidden hover:scale-105 transform transition duration-300">
            <img src={store.image} alt={store.name} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h2 className="text-xl font-bold text-green-700 mb-2">{store.name}</h2>
              <p className="text-sm text-gray-600 mb-4">{store.address}</p>
              <p className="text-sm text-gray-600 mb-4">Opening Hours: {store.hours}</p>
              <a href={store.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:text-green-900 text-sm">
                See on Google Maps
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreList;
