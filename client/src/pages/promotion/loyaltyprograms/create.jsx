import React from 'react';
import LoyaltyProgramForm from './LoyaltyProgramForm';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateLoyaltyProgram = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    await axios.post('/api/promotion/loyalty', data);
    navigate('/admin/loyalty');
  };

  return (
    <div className="p-6">
      <LoyaltyProgramForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateLoyaltyProgram;
