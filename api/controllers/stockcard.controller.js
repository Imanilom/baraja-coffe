import StockCard from '../models/StockCard.model.js';

// Function to update final stock
const updateFinalStock = async (stockCardId) => {
  const stockCard = await StockCard.findById(stockCardId);
  if (stockCard) {
    stockCard.finalStock = stockCard.initialStock + stockCard.stockIn - stockCard.stockOut - stockCard.sales - stockCard.transfer + stockCard.adjustment;
    await stockCard.save();
  }
};

// Add stock
export const addStock = async (req, res) => {
  try {
    const { stockCardId, quantity, notes } = req.body;
    const stockCard = await StockCard.findById(stockCardId);
    if (!stockCard) return res.status(404).json({ message: 'Stock card not found' });

    stockCard.stockIn += quantity;
    stockCard.transactions.push({ type: 'stock_in', quantity, notes });
    await stockCard.save();
    await updateFinalStock(stockCardId);
    
    res.status(200).json(stockCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove stock
export const removeStock = async (req, res) => {
  try {
    const { stockCardId, quantity, notes } = req.body;
    const stockCard = await StockCard.findById(stockCardId);
    if (!stockCard) return res.status(404).json({ message: 'Stock card not found' });

    stockCard.stockOut += quantity;
    stockCard.transactions.push({ type: 'stock_out', quantity, notes });
    await stockCard.save();
    await updateFinalStock(stockCardId);
    
    res.status(200).json(stockCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Transfer stock
export const transferStock = async (req, res) => {
  try {
    const { stockCardId, quantity, notes } = req.body;
    const stockCard = await StockCard.findById(stockCardId);
    if (!stockCard) return res.status(404).json({ message: 'Stock card not found' });

    stockCard.transfer += quantity;
    stockCard.transactions.push({ type: 'transfer', quantity, notes });
    await stockCard.save();
    await updateFinalStock(stockCardId);
    
    res.status(200).json(stockCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stock Opname (Adjustment)
export const adjustStock = async (req, res) => {
  try {
    const { stockCardId, quantity, notes } = req.body;
    const stockCard = await StockCard.findById(stockCardId);
    if (!stockCard) return res.status(404).json({ message: 'Stock card not found' });

    stockCard.adjustment += quantity;
    stockCard.transactions.push({ type: 'adjustment', quantity, notes });
    await stockCard.save();
    await updateFinalStock(stockCardId);
    
    res.status(200).json(stockCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Production (Convert raw materials to final product)
export const produceStock = async (req, res) => {
  try {
    const { stockCardId, rawMaterials, quantity, notes } = req.body;
    const stockCard = await StockCard.findById(stockCardId);
    if (!stockCard) return res.status(404).json({ message: 'Stock card not found' });

    // Reduce raw material stock
    for (let material of rawMaterials) {
      const rawMaterialStock = await StockCard.findById(material.stockCardId);
      if (rawMaterialStock) {
        rawMaterialStock.stockOut += material.quantity * quantity;
        rawMaterialStock.transactions.push({ type: 'stock_out', quantity: material.quantity * quantity, notes: `Used for production of ${stockCard.product}` });
        await rawMaterialStock.save();
        await updateFinalStock(material.stockCardId);
      }
    }

    // Increase final product stock
    stockCard.stockIn += quantity;
    stockCard.transactions.push({ type: 'stock_in', quantity, notes: 'Produced from raw materials' });
    await stockCard.save();
    await updateFinalStock(stockCardId);
    
    res.status(200).json(stockCard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
