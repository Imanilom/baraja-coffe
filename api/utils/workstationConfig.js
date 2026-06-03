import Warehouse from '../models/modul_market/Warehouse.model.js';
import { MenuItem } from '../models/MenuItem.model.js';

// Fungsi utama untuk mendapatkan mapping workstation ke warehouse
export const getWorkstationWarehouseMapping = async (workstation, outlet = 'amphi') => {
  const config = {
    // Default configuration for Amphi outlet
    amphi: {
      kitchen: 'kitchen-amphi',
      bar: {
        'bar-depan': 'bar-depan-amphi',
        'bar-belakang': 'bar-belakang-amphi'
      }
    }
  };

  const outletConfig = config[outlet];
  if (!outletConfig) {
    throw new Error(`No configuration found for outlet: ${outlet}`);
  }

  const warehouses = {};

  if (workstation === 'kitchen' && outletConfig.kitchen) {
    const kitchenWarehouse = await Warehouse.findOne({ code: outletConfig.kitchen });
    if (kitchenWarehouse) {
      warehouses.kitchen = kitchenWarehouse._id;
    }
  } else if (workstation === 'bar' && outletConfig.bar) {
    for (const [barType, code] of Object.entries(outletConfig.bar)) {
      const barWarehouse = await Warehouse.findOne({ code });
      if (barWarehouse) {
        warehouses[barType] = barWarehouse._id;
      }
    }
  }

  return warehouses;
};

// Get all warehouses for a menu item
export const getWarehousesForMenuItem = async (menuItem) => {
  const workstation = menuItem.workstation;
  const outlet = 'amphi'; // Default, bisa di-extend untuk multi-outlet
  
  return await getWorkstationWarehouseMapping(workstation, outlet);
};

// Setup workstation mapping for menu item
export const setupWorkstationMapping = async (menuItemId, outlet = 'amphi') => {
  const menuItem = await MenuItem.findById(menuItemId);
  if (!menuItem) {
    throw new Error('Menu item not found');
  }

  const warehouses = await getWorkstationWarehouseMapping(menuItem.workstation, outlet);
  const workstationMapping = [];

  for (const [workstationType, warehouseId] of Object.entries(warehouses)) {
    workstationMapping.push({
      workstation: workstationType === 'kitchen' ? 'kitchen' : 'bar',
      warehouseId,
      isPrimary: workstationType === 'kitchen' || workstationType === 'bar-depan'
    });
  }

  // Update menu item with workstation mapping
  await MenuItem.findByIdAndUpdate(menuItemId, {
    $set: { workstationMapping }
  });

  return workstationMapping;
};

// Get warehouse name by ID
export const getWarehouseNameById = async (warehouseId) => {
  const warehouse = await Warehouse.findById(warehouseId);
  return warehouse ? warehouse.name : 'Unknown Warehouse';
};

// Get workstation by warehouse code
export const getWorkstationByWarehouseCode = async (warehouseCode) => {
  const warehouse = await Warehouse.findOne({ code: warehouseCode });
  if (!warehouse) return null;

  // Check configuration
  const config = {
    amphi: {
      kitchen: 'kitchen-amphi',
      bar: {
        'bar-depan': 'bar-depan-amphi',
        'bar-belakang': 'bar-belakang-amphi'
      }
    }
  };

  if (warehouse.code === config.amphi.kitchen) {
    return 'kitchen';
  } else if (warehouse.code === config.amphi.bar['bar-depan'] || 
             warehouse.code === config.amphi.bar['bar-belakang']) {
    return 'bar';
  }

  return null;
};

// Get all available workstations with their warehouses
export const getAllWorkstationConfigs = async (outlet = 'amphi') => {
  const config = {
    amphi: {
      kitchen: 'kitchen-amphi',
      bar: {
        'bar-depan': 'bar-depan-amphi',
        'bar-belakang': 'bar-belakang-amphi'
      }
    }
  };

  const outletConfig = config[outlet];
  if (!outletConfig) {
    throw new Error(`No configuration found for outlet: ${outlet}`);
  }

  const result = {
    kitchen: null,
    bar: []
  };

  // Get kitchen warehouse
  if (outletConfig.kitchen) {
    const kitchenWarehouse = await Warehouse.findOne({ code: outletConfig.kitchen });
    if (kitchenWarehouse) {
      result.kitchen = {
        _id: kitchenWarehouse._id,
        name: kitchenWarehouse.name,
        code: kitchenWarehouse.code,
        type: 'kitchen'
      };
    }
  }

  // Get bar warehouses
  if (outletConfig.bar) {
    for (const [barType, code] of Object.entries(outletConfig.bar)) {
      const barWarehouse = await Warehouse.findOne({ code });
      if (barWarehouse) {
        result.bar.push({
          _id: barWarehouse._id,
          name: barWarehouse.name,
          code: barWarehouse.code,
          type: barType,
          displayName: barType === 'bar-depan' ? 'Bar Depan' : 'Bar Belakang'
        });
      }
    }
  }

  return result;
};

// Get primary warehouse for a workstation
export const getPrimaryWarehouseForWorkstation = async (workstation, outlet = 'amphi') => {
  const warehouses = await getWorkstationWarehouseMapping(workstation, outlet);
  
  if (workstation === 'kitchen') {
    return warehouses.kitchen || null;
  } else if (workstation === 'bar') {
    // Bar depan adalah primary untuk workstation bar
    return warehouses['bar-depan'] || null;
  }
  
  return null;
};

// Validate if warehouse belongs to workstation
export const validateWarehouseWorkstation = async (warehouseId, workstation) => {
  const warehouses = await getWorkstationWarehouseMapping(workstation);
  const warehouseValues = Object.values(warehouses);
  
  return warehouseValues.some(w => w.toString() === warehouseId.toString());
};

// Get menu items for a specific warehouse
export const getMenuItemsForWarehouse = async (warehouseId) => {
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) {
    throw new Error('Warehouse not found');
  }

  // Determine workstation based on warehouse code
  const workstation = await getWorkstationByWarehouseCode(warehouse.code);
  if (!workstation) {
    return [];
  }

  // Get all menu items for this workstation
  const menuItems = await MenuItem.find({ 
    workstation,
    isActive: true 
  }).populate('warehouseStocks.warehouseId', 'name code');

  // Filter menu items that have stock in this warehouse
  return menuItems.filter(menuItem => 
    menuItem.warehouseStocks.some(ws => 
      ws.warehouseId && ws.warehouseId._id.toString() === warehouseId.toString()
    )
  );
};

// Export as default object for backward compatibility
const workstationConfig = {
  getWorkstationWarehouseMapping,
  getWarehousesForMenuItem,
  setupWorkstationMapping,
  getWarehouseNameById,
  getWorkstationByWarehouseCode,
  getAllWorkstationConfigs,
  getPrimaryWarehouseForWorkstation,
  validateWarehouseWorkstation,
  getMenuItemsForWarehouse
};

export default workstationConfig;