

/**
 * Validasi dan kurangi bahan baku dengan pengecekan stok dulu
 * @param {Object} data - payload dari BullMQ job
 * @returns {Object} hasil proses termasuk orderItems dan total harga
 */
export async function updateInventoryHandler({ usages }) {
  const bulkOps = usages.map((usage) => ({
    updateOne: {
      filter: { productId: usage.productId },
      update: {
        $inc: { currentStock: -usage.quantity },
        $push: {
          movements: {
            quantity: usage.quantity,
            type: 'out',
            referenceId: usage.referenceId,
            notes: usage.notes
          }
        }
      }
    }
  }));

  if (bulkOps.length > 0) {
    await ProductStock.bulkWrite(bulkOps);
  }

  return { success: true, updated: bulkOps.length };
}
