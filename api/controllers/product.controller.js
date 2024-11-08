import Product from '../models/product.model.js';

export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getProductById = async (req, res) => {
  const { id } = req.params; // Mengambil ID dari parameter URL

  try {
    // Mencari produk berdasarkan ID
    const product = await Product.findById(id);
    // Jika produk tidak ditemukan
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Jika produk ditemukan, kembalikan data produk
    return res.status(200).json({ product });
  } catch (error) {
    // Jika ada kesalahan
    return res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};


export const updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
