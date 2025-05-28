import React, { useState } from 'react';

const LoyaltyProgramForm = ({ onSubmit, initialData = {} }) => {
  const [form, setForm] = useState({
    name: initialData.name ,
    description: initialData.description || '',
    consumertype: initialData.consumertype || 'member',
    pointsPerRp: initialData.pointsPerRp || 100,
    registrationPoints: initialData.registrationPoints || 50,
    firstTransactionPoints: initialData.firstTransactionPoints || 100,
    pointsToDiscountRatio: initialData.pointsToDiscountRatio || 100,
    discountValuePerPoint: initialData.discountValuePerPoint || 50,
    isActive: initialData.isActive ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white shadow-md rounded-md p-6 space-y-4">
      <h2 className="text-xl font-bold">Loyalty Program Form</h2>

      {[
        { label: 'Name', name: 'name' },
        { label: 'Description', name: 'description' },
        { label: 'Consumer Type', name: 'consumertype' },
        { label: 'Points per Rp', name: 'pointsPerRp', type: 'number' },
        { label: 'Registration Points', name: 'registrationPoints', type: 'number' },
        { label: 'First Transaction Points', name: 'firstTransactionPoints', type: 'number' },
        { label: 'Points to Discount Ratio', name: 'pointsToDiscountRatio', type: 'number' },
        { label: 'Discount Value per Point', name: 'discountValuePerPoint', type: 'number' }
      ].map(({ label, name, type = 'text' }) => (
        <div key={name}>
          <label className="block font-semibold">{label}</label>
          <input
            type={type}
            name={name}
            value={form[name]}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md mt-1"
            required={name !== 'description'}
          />
        </div>
      ))}

      <div>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="mr-2"
          />
          Active
        </label>
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Save
      </button>
    </form>
  );
};

export default LoyaltyProgramForm;
