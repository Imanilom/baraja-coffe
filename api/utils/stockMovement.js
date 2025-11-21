import ProductStock from '../models/modul_menu/ProductStock.model.js';

// utils/stockMovement.js
export const recordStockMovement = async (session, {
  productId,
  quantity,
  type, // 'in', 'out', 'transfer'
  referenceId,
  notes,
  sourceWarehouse,
  destinationWarehouse,
  handledBy,
  date = new Date()
}) => {
  try {
    // Validasi input
    if (!productId || !quantity || !type) {
      throw new Error('ProductId, quantity, dan type wajib diisi');
    }

    if (type === 'out' && !sourceWarehouse) {
      throw new Error('Source warehouse wajib untuk type out');
    }

    if (type === 'in' && !destinationWarehouse) {
      throw new Error('Destination warehouse wajib untuk type in');
    }

    if (type === 'transfer' && (!sourceWarehouse || !destinationWarehouse)) {
      throw new Error('Source dan destination warehouse wajib untuk type transfer');
    }

    let stockRecord;
    let movementData;

    switch (type) {
      case 'out':
        // Kurangi stok dari source warehouse
        stockRecord = await ProductStock.findOneAndUpdate(
          { 
            productId, 
            warehouse: sourceWarehouse,
            currentStock: { $gte: quantity } // Pastikan stok cukup
          },
          {
            $inc: { currentStock: -quantity },
            $push: {
              movements: {
                quantity: -quantity,
                type: 'out',
                referenceId,
                notes,
                sourceWarehouse,
                handledBy,
                date
              }
            }
          },
          { 
            new: true, 
            session,
            runValidators: true 
          }
        );

        if (!stockRecord) {
          throw new Error(`Stok tidak cukup di warehouse ${sourceWarehouse} untuk product ${productId}`);
        }
        break;

      case 'in':
        // Tambah stok ke destination warehouse
        stockRecord = await ProductStock.findOneAndUpdate(
          { 
            productId, 
            warehouse: destinationWarehouse 
          },
          {
            $inc: { currentStock: quantity },
            $push: {
              movements: {
                quantity: quantity,
                type: 'in',
                referenceId,
                notes,
                destinationWarehouse,
                handledBy,
                date
              }
            }
          },
          { 
            upsert: true,
            new: true, 
            session,
            runValidators: true 
          }
        );
        break;

      case 'transfer':
        // Kurangi dari source, tambah ke destination
        const sourceUpdate = await ProductStock.findOneAndUpdate(
          { 
            productId, 
            warehouse: sourceWarehouse,
            currentStock: { $gte: quantity }
          },
          {
            $inc: { currentStock: -quantity },
            $push: {
              movements: {
                quantity: -quantity,
                type: 'transfer',
                referenceId,
                notes,
                sourceWarehouse,
                destinationWarehouse,
                handledBy,
                date
              }
            }
          },
          { 
            new: true, 
            session 
          }
        );

        if (!sourceUpdate) {
          throw new Error(`Stok tidak cukup di warehouse ${sourceWarehouse} untuk transfer`);
        }

        // Tambah ke destination warehouse
        await ProductStock.findOneAndUpdate(
          { 
            productId, 
            warehouse: destinationWarehouse 
          },
          {
            $inc: { currentStock: quantity },
            $push: {
              movements: {
                quantity: quantity,
                type: 'transfer',
                referenceId,
                notes,
                sourceWarehouse,
                destinationWarehouse,
                handledBy,
                date
              }
            }
          },
          { 
            upsert: true,
            new: true, 
            session 
          }
        );

        stockRecord = sourceUpdate;
        break;

      default:
        throw new Error(`Type movement tidak valid: ${type}`);
    }

    return stockRecord;
  } catch (error) {
    console.error('Error recording stock movement:', error);
    throw error;
  }
};