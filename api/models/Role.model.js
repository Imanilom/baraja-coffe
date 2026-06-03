import mongoose from 'mongoose';

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: [
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
        'manage_finance',
        'manage_reservations',
        'manage_vendors',
        'manage_expenses',
        'manage_events',
        'view_audit_logs',
        'superadmin'
      ]
    }
  ]
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);

export default Role;
