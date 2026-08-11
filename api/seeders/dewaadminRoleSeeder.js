import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/Role.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDewaAdminRole = async () => {
  try {
    const mongoUri = process.env.MONGO_PROD || process.env.MONGO;
    if (!mongoUri) {
      console.error('MONGO or MONGO_PROD env variable not found');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const roleName = 'dewaadmin';
    const existingRole = await Role.findOne({ name: roleName });

    if (existingRole) {
      console.log(`Role '${roleName}' already exists. Updating permissions if needed.`);
      existingRole.permissions = ['superadmin', 'manage_orders'];
      await existingRole.save();
      console.log('Permissions updated.');
    } else {
      console.log(`Creating new role '${roleName}'...`);
      const newRole = new Role({
        name: roleName,
        description: 'Dewa Admin role for unbridled access to orders and special features',
        permissions: ['superadmin', 'manage_orders']
      });
      await newRole.save();
      console.log('Role created successfully.');
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding role:', error);
    process.exit(1);
  }
};

seedDewaAdminRole();
