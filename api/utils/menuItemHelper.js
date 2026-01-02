/**
 * Helper function untuk mendapatkan data menu item yang aman
 * bahkan jika menu item sudah dihapus
 */
export const getSafeMenuItemData = (item) => {
  // Prioritaskan data denormalized jika ada dan valid
  if (item.menuItemData && item.menuItemData.name && item.menuItemData.name !== '') {
    return {
      _id: item.menuItem || null,
      name: item.menuItemData.name,
      price: item.menuItemData.price || 0,
      category: item.menuItemData.category || 'Uncategorized',
      sku: item.menuItemData.sku || '',
      isActive: item.menuItemData.isActive !== false,
      isDeleted: item.menuItemData.isActive === false
    };
  }
  
  // Fallback jika tidak ada data denormalized
  if (!item.menuItem) {
    return {
      _id: null,
      name: 'Custom Item',
      price: item.subtotal / (item.quantity || 1) || 0,
      category: 'Custom',
      sku: 'CUSTOM',
      isActive: true,
      isDeleted: false
    };
  }
  
  // Jika ada reference menuItem tapi data denormalized tidak lengkap
  return {
    _id: item.menuItem,
    name: 'Menu Item Not Found',
    price: item.subtotal / (item.quantity || 1) || 0,
    category: 'Unknown',
    sku: 'UNKNOWN',
    isActive: false,
    isDeleted: true
  };
};

/**
 * Helper function untuk memproses items dalam order
 */
export const processOrderItems = (items = []) => {
  return items.map(item => {
    const menuItemData = getSafeMenuItemData(item);
    
    return {
      ...item,
      menuItem: menuItemData,
      safeName: menuItemData.name,
      safePrice: menuItemData.price,
      isMenuActive: menuItemData.isActive,
      isMenuDeleted: menuItemData.isDeleted
    };
  });
};

/**
 * Helper untuk mendapatkan summary produk dari order items
 */
export const getProductSummaryFromOrders = (orders = []) => {
  const productSummary = {};
  
  orders.forEach(order => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach(item => {
        const menuItemData = getSafeMenuItemData(item);
        const productId = menuItemData._id ? menuItemData._id.toString() : `custom_${menuItemData.name}`;
        
        if (!productSummary[productId]) {
          productSummary[productId] = {
            productId: menuItemData._id,
            productName: menuItemData.name,
            category: menuItemData.category,
            sku: menuItemData.sku,
            isActive: menuItemData.isActive,
            isDeleted: menuItemData.isDeleted,
            totalQuantity: 0,
            totalRevenue: 0,
            totalOrders: 0,
            averagePrice: 0
          };
        }
        
        productSummary[productId].totalQuantity += item.quantity || 0;
        productSummary[productId].totalRevenue += item.subtotal || 0;
        productSummary[productId].totalOrders += 1;
      });
    }
  });
  
  // Calculate average price
  Object.keys(productSummary).forEach(key => {
    const product = productSummary[key];
    product.averagePrice = product.totalQuantity > 0 
      ? Math.round((product.totalRevenue / product.totalQuantity) * 100) / 100
      : 0;
  });
  
  return Object.values(productSummary);
};

/**
 * Filter untuk hanya menampilkan produk aktif (opsional)
 */
export const filterActiveProducts = (productSummary = []) => {
  return productSummary.filter(product => product.isActive);
};

/**
 * Filter untuk menampilkan produk yang dihapus (opsional)
 */
export const filterDeletedProducts = (productSummary = []) => {
  return productSummary.filter(product => product.isDeleted);
};