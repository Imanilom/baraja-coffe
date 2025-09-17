import mongoose from 'mongoose';

const SidebarMenuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  requiredPermissions: [
    {
      type: String,
      enum: [
        'manage_users',
        'manage_roles',
        'manage_products',
        'view_reports',
        'manage_outlets',
        'manage_inventory',
        'manage_vouchers',
        'manage_promo',
        'manage_orders',
        'manage_shifts',
        'manage_operational',
        'manage_loyalty',
        'manage_finance'
      ]
    }
  ],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SidebarMenu',
    default: null
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SidebarMenu'
    }
  ],
  isSubmenu: {
    type: Boolean,
    default: false
  },
  badge: {
    text: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      enum: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      default: 'primary'
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual untuk mengecek apakah menu ini memiliki children
SidebarMenuSchema.virtual('hasChildren').get(function() {
  return this.children && this.children.length > 0;
});

// Index untuk performa yang lebih baik
SidebarMenuSchema.index({ order: 1, isActive: 1 });
SidebarMenuSchema.index({ parentId: 1 });

// Static method untuk mendapatkan menu berdasarkan permissions user
SidebarMenuSchema.statics.getMenuByPermissions = async function(userPermissions) {
  try {
    // Ambil semua menu yang aktif dan urutkan berdasarkan order
    const menus = await this.find({ 
      isActive: true,
      parentId: null 
    })
    .populate({
      path: 'children',
      match: { isActive: true },
      options: { sort: { order: 1 } }
    })
    .sort({ order: 1 })
    .lean();

    // Filter menu berdasarkan permissions
    const filteredMenus = menus.filter(menu => {
      // Jika menu tidak membutuhkan permission khusus, tampilkan
      if (!menu.requiredPermissions || menu.requiredPermissions.length === 0) {
        return true;
      }
      
      // Cek apakah user memiliki salah satu permission yang dibutuhkan
      return menu.requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    }).map(menu => {
      // Filter children juga berdasarkan permissions
      if (menu.children && menu.children.length > 0) {
        menu.children = menu.children.filter(child => {
          if (!child.requiredPermissions || child.requiredPermissions.length === 0) {
            return true;
          }
          return child.requiredPermissions.some(permission => 
            userPermissions.includes(permission)
          );
        });
      }
      return menu;
    });

    return filteredMenus;
  } catch (error) {
    throw new Error(`Error getting menu by permissions: ${error.message}`);
  }
};

// Method untuk mengecek apakah user dapat mengakses menu tertentu
SidebarMenuSchema.statics.canAccessMenu = async function(menuId, userPermissions) {
  try {
    const menu = await this.findById(menuId);
    
    if (!menu || !menu.isActive) {
      return false;
    }

    // Jika menu tidak membutuhkan permission khusus
    if (!menu.requiredPermissions || menu.requiredPermissions.length === 0) {
      return true;
    }

    // Cek apakah user memiliki permission yang dibutuhkan
    return menu.requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  } catch (error) {
    throw new Error(`Error checking menu access: ${error.message}`);
  }
};

const SidebarMenu = mongoose.model('SidebarMenu', SidebarMenuSchema);

export default SidebarMenu;