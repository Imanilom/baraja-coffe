import SidebarMenu from '../models/Sidebar.model.js';
import { SidebarHelper } from '../helpers/sidebarHelper.js';

export class SidebarController {
  
  // Mendapatkan menu untuk user yang sedang login
  static async getUserMenus(req, res) {
    try {
      const user = req.user; // dari auth middleware
      
      if (!user || !user.role) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated or role not found'
        });
      }

      const menus = await SidebarHelper.getMenuForUser(user);
      
      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Mendapatkan semua menu (untuk management)
  static async getAllMenus(req, res) {
    try {
      const menus = await SidebarMenu.find({})
        .populate('children')
        .sort({ order: 1 });
      
      res.json({
        success: true,
        data: menus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Membuat menu baru
  static async createMenu(req, res) {
    try {
      const {
        name,
        icon,
        path,
        requiredPermissions,
        parentId,
        order
      } = req.body;

      const menu = new SidebarMenu({
        name,
        icon,
        path,
        requiredPermissions,
        parentId: parentId || null,
        order: order || 0,
        isSubmenu: !!parentId
      });

      await menu.save();

      // Jika ada parentId, update parent dengan child ID
      if (parentId) {
        await SidebarMenu.findByIdAndUpdate(parentId, {
          $push: { children: menu._id }
        });
      }

      res.status(201).json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Update menu
  static async updateMenu(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const menu = await SidebarMenu.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Hapus menu
  static async deleteMenu(req, res) {
    try {
      const { id } = req.params;

      // Cek apakah menu memiliki children
      const menu = await SidebarMenu.findById(id).populate('children');
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }

      // Jika ada children, hapus juga children-nya
      if (menu.children && menu.children.length > 0) {
        await SidebarMenu.deleteMany({ 
          _id: { $in: menu.children.map(child => child._id) }
        });
      }

      // Hapus dari parent jika ini adalah submenu
      if (menu.parentId) {
        await SidebarMenu.findByIdAndUpdate(menu.parentId, {
          $pull: { children: menu._id }
        });
      }

      await SidebarMenu.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Menu deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Toggle status aktif menu
  static async toggleMenuStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const menu = await SidebarHelper.toggleMenuStatus(id, isActive);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Admin: Update urutan menu
  static async updateMenuOrder(req, res) {
    try {
      const { id } = req.params;
      const { order } = req.body;

      const menu = await SidebarHelper.updateMenuOrder(id, order);

      if (!menu) {
        return res.status(404).json({
          success: false,
          message: 'Menu not found'
        });
      }

      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}
