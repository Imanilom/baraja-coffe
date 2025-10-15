import express from 'express';
import { insertInitialStocks, getProductStock, addStockMovement, getAllStock, getStockMovements, updateMinStock } from '../controllers/ProductStock.controller.js';
import { getMenuStockDetails, updateMenuAvailableStock, updateSingleMenuStock, adjustMenuStock, createRecipe, deleteRecipe, getAllRecipes, getRecipeById, getRecipeByMenuId, updateRecipe, getMenuStocks } from '../controllers/Recipe.controller.js';
import { verifyToken } from '../utils/verifyUser.js';
const router = express.Router();
const inventoryAccess = verifyToken(['superadmin', 'admin', 'inventory', 'accounting']);

router.post('/stocks/initial-batch', insertInitialStocks);

router.get('/stock', getProductStock);
router.post('/stock/movement', inventoryAccess, addStockMovement);
router.get('/stock/:productId/movements', getStockMovements);
router.put('/stock/:productId/min-stock', inventoryAccess, updateMinStock);
router.get('/stock/all', getAllStock);

router.get('/menu-stock', updateMenuAvailableStock);
router.get('/menu-stock/manual-stock', getMenuStocks);
router.put('/menu/:menuItemId/update-stock', updateSingleMenuStock);
router.put('/menu/:menuItemId/adjust-stock', adjustMenuStock);
router.get('/menu/:menuItemId/details', getMenuStockDetails);

router.post('/recipes', inventoryAccess, createRecipe);
router.get('/recipes', getAllRecipes);
router.get('/recipes/:id', getRecipeById);
router.put('/recipes/:id', inventoryAccess, updateRecipe);
router.delete('/recipes/:id', inventoryAccess, deleteRecipe);
router.get('/recipes/menu/:menuId', getRecipeByMenuId);


export default router;