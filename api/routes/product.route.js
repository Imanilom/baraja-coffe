import express from 'express';
import { createProduct, getProducts, updateProduct, deleteProduct, getProductById} from '../controllers/product.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/', verifyToken(["admin", "superadmin"]), createProduct);
router.get('/', verifyToken(["admin", "superadmin"]), getProducts);
router.get('/:id', verifyToken(["admin", "superadmin"]), getProductById);
router.put('/:id', verifyToken(["admin", "superadmin"]), updateProduct);
router.delete('/:id', verifyToken(["admin", "superadmin"]), deleteProduct);

export default router;
