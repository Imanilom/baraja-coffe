import api from '../lib/axios';

// Menu Item Services
export const getMenuItems = async () => {
  const response = await api.get(`/menu-items`);
  return response.data.data;
};

export const getMenuItemById = async (id) => {
  const response = await api.get(`/menu-items/${id}`);
  return response.data.data;
};

export const createMenuItem = async (data) => {
  await api.post(`/menu-items`, data);
};

export const updateMenuItem = async (id, data) => {
  await api.put(`/menu-items/${id}`, data);
};

export const deleteMenuItem = async (id) => {
  await api.delete(`/menu-items/${id}`);
};

// Topping Services
export const getToppings = async () => {
  const response = await api.get(`/toppings`);
  return response.data.data;
};

export const getToppingById = async (id) => {
  const response = await api.get(`/toppings/${id}`);
  return response.data.data;
};

export const createTopping = async (data) => {
  await api.post(`/toppings`, data);
};

export const updateTopping = async (id, data) => {
  await api.put(`/toppings/${id}`, data);
};

export const deleteTopping = async (id) => {
  await api.delete(`/toppings/${id}`);
};

// Promotion Services
export const getPromotions = async () => {
  const response = await api.get(`/promotion`);
  return response.data.data;
};

export const getPromotionById = async (id) => {
  const response = await api.get(`/promotion/${id}`);
  return response.data.data;
};

export const createPromotion = async (data) => {
  await api.post(`/promotion`, data);
};

export const updatePromotion = async (id, data) => {
  await api.put(`/promotion/${id}`, data);
};

export const deletePromotion = async (id) => {
  await api.delete(`/promotion/${id}`);
};

// Order Services
export const getAllOrders = async () => {
  const response = await api.get(`/orders`);
  return response.data.data;
}

// Voucher Services
export const getVouchers = async () => {
  const response = await api.get(`/voucher/admin`);
  return response.data.data;
};

export const getVoucherById = async (id) => {
  const response = await api.get(`/voucher/admin/${id}`);
  return response.data.data;
};

export const createVoucher = async (data) => {
  await api.post(`/voucher/admin`, data);
};

export const updateVoucher = async (id, data) => {
  await api.put(`/voucher/admin/${id}`, data);
};

export const deleteVoucher = async (id) => {
  await api.delete(`/voucher/admin/${id}`);
};

export const claimVoucher = async (data) => {
  await api.post(`/voucher/customer/claim`, data);
};

export const getUserVouchers = async (userId) => {
  const response = await api.get(`/voucher/customer/user/${userId}`);
  return response.data.data;
};

// Storage Services
export const getRawMaterials = async () => {
  const response = await api.get(`/storage/raw-material`);
  return response.data.data;
};

export const createRawMaterial = async (data) => {
  await api.post(`/storage/raw-material`, data);
};

export const updateRawMaterial = async (id, data) => {
  await api.put(`/storage/raw-material/${id}`, data);
};

export const deleteRawMaterial = async (id) => {
  await api.delete(`/storage/raw-material/${id}`);
};

export const getStockOpnames = async () => {
  const response = await api.get(`/storage/stock-opname`);
  return response.data.data;
};

export const createStockOpname = async (data) => {
  await api.post(`/storage/stock-opname`, data);
};

export const updateStockOpname = async (id, data) => {
  await api.put(`/storage/stock-opname/${id}`, data);
};

export const deleteStockOpname = async (id) => {
  await api.delete(`/storage/stock-opname/${id}`);
};

// Order Services

export const getOrders = async () => {
  const response = await api.get(`/order-all`);
  return response.data.data;
};
