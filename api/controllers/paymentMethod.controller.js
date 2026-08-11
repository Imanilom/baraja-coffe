import { PaymentMethod } from '../models/PaymentMethod.model.js';

// --- STANDARD CRUD FOR BACKOFFICE ---

export const createPaymentMethod = async (req, res) => {
  try {
    const newPaymentMethod = new PaymentMethod(req.body);
    await newPaymentMethod.save();
    res.status(201).json({ success: true, data: newPaymentMethod });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: paymentMethods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentMethodById = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: paymentMethod });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPaymentMethod) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: updatedPaymentMethod });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(req.params.id);
    if (!deletedPaymentMethod) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// --- BACKWARD COMPATIBLE ROUTES FOR POS / APP ---

const GROUP_DETAILS = {
  'cash': { name: 'Cash', icon: 'cash.png' },
  'ewallet': { name: 'E-Wallet', icon: 'ewallet.png' },
  'debit': { name: 'Debit', icon: 'debit.png' },
  'banktransfer': { name: 'Bank Transfer', icon: 'bank-transfer.png' },
  'qris': { name: 'QRIS', icon: 'qris.png' }
};

export const getPaymentMethodsAndTypes = async (req, res) => {
  try {
    const activeMethods = await PaymentMethod.find({ isActive: true });

    // Build unique groups from methodIds
    const groupSet = new Set();
    activeMethods.forEach(m => {
      if (m.methodIds && m.methodIds.length > 0) {
        m.methodIds.forEach(id => groupSet.add(id));
      }
    });

    const paymentMethodsFormat1 = Array.from(groupSet).map(groupId => {
      const details = GROUP_DETAILS[groupId] || { name: groupId, icon: 'default.png' };
      return {
        id: groupId,
        name: details.name,
        methodCode: details.name,
        icon: details.icon,
        isActive: true,
      };
    });

    // Build the types array
    const paymentTypesFormat1 = activeMethods.map(m => {
      return {
        id: m.bank_code,
        name: m.name,
        typeCode: m.typeCode || m.name,
        methodIds: m.methodIds,
        isDigital: m.isDigital,
        isActive: m.isActive
      };
    });

    // Merge them as expected
    const buildPaymentMethods = () => {
      return paymentMethodsFormat1.map((method) => {
        return {
          ...method,
          paymentTypes: paymentTypesFormat1.filter((pt) => pt.methodIds.includes(method.id)),
        };
      });
    };

    res.status(200).json({
      success: true,
      paymentMethods: buildPaymentMethods(),
    });
  } catch (error) {
    console.error('Error fetching payment methods and types:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment methods and types' });
  }
};

export const getPaymentMethodsLegacy = async (req, res) => {
  try {
    const activeMethods = await PaymentMethod.find({ isActive: true });
    
    // Map to exactly match format 2
    const mapped = activeMethods.map(m => ({
      name: m.name,
      icon: m.icon,
      color: m.color,
      payment_method: m.payment_method,
      payment_method_name: m.payment_method_name,
      bank_code: m.bank_code,
      isBank: m.isBank,
      isCash: m.isCash,
      isPtBank: m.isPtBank,
      groOnly: m.groOnly
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching legacy payment methods:', error);
    res.status(500).json({ success: false, message: 'Failed' });
  }
};
