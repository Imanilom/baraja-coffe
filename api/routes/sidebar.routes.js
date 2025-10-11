import express from 'express';
import { SidebarController } from '../controllers/sidebar.controller.js';
import { verifyToken } from "../utils/verifyUser.js";

const router = express.Router();

const superadminAccess = verifyToken(['superadmin']);
const access = verifyToken(['superadmin', 'admin', 'hrd', 'akuntan', 'inventory', 'marketing']);
// Public routes (untuk user yang sudah login)
router.get('/menus', access, SidebarController.getUserMenus);

// Admin routes
router.get('/admin/menus',
  superadminAccess,
  SidebarController.getAllMenus
);

router.post('/admin/menus',
  superadminAccess,
  SidebarController.createMenu
);

router.put('/admin/menus/:id',
  superadminAccess,
  SidebarController.updateMenu
);

router.delete('/admin/menus/:id',
  superadminAccess,
  SidebarController.deleteMenu
);

router.patch('/admin/menus/:id/toggle',
  superadminAccess,
  SidebarController.toggleMenuStatus
);

router.patch('/admin/menus/:id/order',
  superadminAccess,
  SidebarController.updateMenuOrder
);

export default router;
