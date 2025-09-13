import express from 'express';
import { insertInitialStocks ,getProductStock, addStockMovement, getAllStock, getStockMovements, updateMinStock } from '../controllers/ProductStock.controller.js';
import { getMenuStockDetails, updateMenuAvailableStock, updateSingleMenuStock, createRecipe, deleteRecipe, getAllRecipes, getRecipeById, getRecipeByMenuId, updateRecipe} from '../controllers/Recipe.controller.js';
const router = express.Router();

router.post('/stocks/initial-batch', insertInitialStocks);

router.get('/stock', getProductStock);
router.post('/stock/movement', addStockMovement);
router.get('/stock/:productId/movements', getStockMovements);
router.put('/stock/:productId/min-stock', updateMinStock);
router.get('/stock/all', getAllStock);

router.get('/menu-stock', updateMenuAvailableStock);
router.put('/menu/:menuItemId/update-stock', updateSingleMenuStock);
router.get('/menu/:menuItemId/details', getMenuStockDetails);


router.route('/recipes')
  .post(createRecipe)
  .get(getAllRecipes);

router.route('/recipes/:id')
  .get(getRecipeById)
  .put(updateRecipe)
  .delete(deleteRecipe);

router.route('/recipes/menu/:menuId')
  .get(getRecipeByMenuId);


export default router;