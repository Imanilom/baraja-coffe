import SidebarMenu from "../models/Sidebar.model.js";

export class SidebarHelper {

  // Mendapatkan menu berdasarkan user dan role
  static async getMenuForUser(user) {
    try {
      // Asumsi user sudah populate dengan role
      const userPermissions = user.role?.permissions || [];

      // Dapatkan menu yang bisa diakses user
      const menus = await SidebarMenu.getMenuByPermissions(userPermissions);

      return menus;
    } catch (error) {
      throw new Error(`Error getting menu for user: ${error.message}`);
    }
  }

  // Mengecek apakah user bisa mengakses path tertentu
  static async canUserAccessPath(user, path) {
    try {
      const userPermissions = user.role?.permissions || [];

      // Cari menu berdasarkan path
      const menu = await SidebarMenu.findOne({ path, isActive: true });

      if (!menu) {
        return false;
      }

      return await SidebarMenu.canAccessMenu(menu._id, userPermissions);
    } catch (error) {
      throw new Error(`Error checking path access: ${error.message}`);
    }
  }

  // Mendapatkan breadcrumb berdasarkan path aktif
  static async getBreadcrumb(path) {
    try {
      const menu = await SidebarMenu.findOne({ path, isActive: true })
        .populate('parentId');

      if (!menu) {
        return [];
      }

      const breadcrumb = [menu];

      // Jika ada parent, tambahkan ke breadcrumb
      if (menu.parentId) {
        breadcrumb.unshift(menu.parentId);
      }

      return breadcrumb.map(item => ({
        name: item.name,
        path: item.path,
        icon: item.icon
      }));
    } catch (error) {
      throw new Error(`Error getting breadcrumb: ${error.message}`);
    }
  }

  // Toggle aktif/nonaktif menu
  static async toggleMenuStatus(menuId, isActive) {
    try {
      const menu = await SidebarMenu.findByIdAndUpdate(
        menuId,
        { isActive },
        { new: true }
      );

      return menu;
    } catch (error) {
      throw new Error(`Error toggling menu status: ${error.message}`);
    }
  }

  // Update urutan menu
  static async updateMenuOrder(menuId, newOrder) {
    try {
      const menu = await SidebarMenu.findByIdAndUpdate(
        menuId,
        { order: newOrder },
        { new: true }
      );

      return menu;
    } catch (error) {
      throw new Error(`Error updating menu order: ${error.message}`);
    }
  }
}

// Contoh penggunaan dalam middleware atau controller
export const sidebarMiddleware = async (req, res, next) => {
  try {
    // Asumsi user sudah ada di req dari auth middleware
    if (req.user) {
      // Dapatkan menu untuk user
      const userMenus = await SidebarHelper.getMenuForUser(req.user);

      // Simpan di res.locals agar bisa diakses di template
      res.locals.sidebarMenus = userMenus;

      // Dapatkan breadcrumb jika ada path
      if (req.path) {
        const breadcrumb = await SidebarHelper.getBreadcrumb(req.path);
        res.locals.breadcrumb = breadcrumb;
      }
    }

    next();
  } catch (error) {
    console.error('Sidebar middleware error:', error);
    next();
  }
};
