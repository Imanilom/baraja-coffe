import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// Menu Item Services
export const getMenuItems = async () => {
  const response = await axios.get(`${API_URL}/menu-items`);
  return response.data.data;
};

export const getMenuItemById = async (id) => {
  const response = await axios.get(`${API_URL}/menu-items/${id}`);
  return response.data.data;
};

export const createMenuItem = async (data) => {
  await axios.post(`${API_URL}/menu-items`, data);
};

export const updateMenuItem = async (id, data) => {
  await axios.put(`${API_URL}/menu-items/${id}`, data);
};

export const deleteMenuItem = async (id) => {
  await axios.delete(`${API_URL}/menu-items/${id}`);
};

// Topping Services
export const getToppings = async () => {
  const response = await axios.get(`${API_URL}/toppings`);
  return response.data.data;
};

export const getToppingById = async (id) => {
  const response = await axios.get(`${API_URL}/toppings/${id}`);
  return response.data.data;
};

export const createTopping = async (data) => {
  await axios.post(`${API_URL}/toppings`, data);
};

export const updateTopping = async (id, data) => {
  await axios.put(`${API_URL}/toppings/${id}`, data);
};

export const deleteTopping = async (id) => {
  await axios.delete(`${API_URL}/toppings/${id}`);
};

// Promotion Services
export const getPromotions = async () => {
  const response = await axios.get(`${API_URL}/promotion`);
  return response.data.data;
};

export const getPromotionById = async (id) => {
  const response = await axios.get(`${API_URL}/promotion/${id}`);
  return response.data.data;
};

export const createPromotion = async (data) => {
  await axios.post(`${API_URL}/promotion`, data);
};

export const updatePromotion = async (id, data) => {
  await axios.put(`${API_URL}/promotion/${id}`, data);
};

export const deletePromotion = async (id) => {
  await axios.delete(`${API_URL}/promotion/${id}`);
};

// Order Services
export const getAllOrders = async () => {
  const response = await axios.get(`${API_URL}/orders`);
  return response.data.data;
}

// Voucher Services
export const getVouchers = async () => {
  const response = await axios.get(`${API_URL}/voucher/admin`);
  return response.data.data;
};

export const getVoucherById = async (id) => {
  const response = await axios.get(`${API_URL}/voucher/admin/${id}`);
  return response.data.data;
};

export const createVoucher = async (data) => {
  await axios.post(`${API_URL}/voucher/admin`, data);
};

export const updateVoucher = async (id, data) => {
  await axios.put(`${API_URL}/voucher/admin/${id}`, data);
};

export const deleteVoucher = async (id) => {
  await axios.delete(`${API_URL}/voucher/admin/${id}`);
};

export const claimVoucher = async (data) => {
  await axios.post(`${API_URL}/voucher/customer/claim`, data);
};

export const getUserVouchers = async (userId) => {
  const response = await axios.get(`${API_URL}/voucher/customer/user/${userId}`);
  return response.data.data;
};

// Storage Services
export const getRawMaterials = async () => {
  const response = await axios.get(`${API_URL}/storage/raw-material`);
  return response.data.data;
};

export const createRawMaterial = async (data) => {
  await axios.post(`${API_URL}/storage/raw-material`, data);
};

export const updateRawMaterial = async (id, data) => {
  await axios.put(`${API_URL}/storage/raw-material/${id}`, data);
};

export const deleteRawMaterial = async (id) => {
  await axios.delete(`${API_URL}/storage/raw-material/${id}`);
};

export const getStockOpnames = async () => {
  const response = await axios.get(`${API_URL}/storage/stock-opname`);
  return response.data.data;
};

export const createStockOpname = async (data) => {
  await axios.post(`${API_URL}/storage/stock-opname`, data);
};

export const updateStockOpname = async (id, data) => {
  await axios.put(`${API_URL}/storage/stock-opname/${id}`, data);
};

export const deleteStockOpname = async (id) => {
  await axios.delete(`${API_URL}/storage/stock-opname/${id}`);
};

// Order Services

export const getOrders = async () => {
  const response = await axios.get(`${API_URL}/order-all`);
  return response.data.data;
};
