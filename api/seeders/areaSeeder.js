import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Area from '../models/Area.model.js';
import Table from '../models/Table.model.js';

dotenv.config();

const areas = [
    { area_code: 'A', area_name: 'Area VIP A', capacity: 20, description: 'Area VIP dengan view terbaik', table_count: 5 },
    { area_code: 'B', area_name: 'Area VIP B', capacity: 18, description: 'Area VIP dengan fasilitas premium', table_count: 5 },
    { area_code: 'C', area_name: 'Area Regular C', capacity: 25, description: 'Area regular yang nyaman', table_count: 6 },
    { area_code: 'D', area_name: 'Area Regular D', capacity: 22, description: 'Area regular dengan suasana tenang', table_count: 6 },
    { area_code: 'E', area_name: 'Area Family E', capacity: 30, description: 'Area khusus keluarga', table_count: 5 },
    { area_code: 'F', area_name: 'Area Family F', capacity: 28, description: 'Area family dengan playground', table_count: 5 },
    { area_code: 'G', area_name: 'Area Outdoor G', capacity: 35, description: 'Area outdoor dengan garden view', table_count: 7 },
    { area_code: 'H', area_name: 'Area Outdoor H', capacity: 32, description: 'Area outdoor dengan live music stage', table_count: 6 },
    { area_code: 'I', area_name: 'Area Private I', capacity: 12, description: 'Area private untuk meeting', table_count: 3 },
    { area_code: 'J', area_name: 'Area Private J', capacity: 15, description: 'Area private dengan karaoke', table_count: 3 }
];

function generateTableNumber(areaCode, tableIndex) {
    return `${areaCode}${String(tableIndex).padStart(2, '0')}`;
}

function getTableType(areaName) {
    if (areaName.includes('VIP')) return 'vip';
    if (areaName.includes('Family')) return 'family';
    if (areaName.includes('Private')) return 'vip';
    return 'regular';
}

function getSeatsCount(areaName, tableType) {
    if (tableType === 'vip') return 4;
    if (tableType === 'family') return 6;
    if (areaName.includes('Private')) return 4;
    return 4; // default
}

async function seedAreasAndTables() {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Table.deleteMany({});
        await Area.deleteMany({});
        console.log('Cleared existing areas and tables');

        // Insert areas and get their IDs
        const insertedAreas = await Area.insertMany(areas.map(area => ({
            area_code: area.area_code,
            area_name: area.area_name,
            capacity: area.capacity,
            description: area.description
        })));
        console.log('Areas seeded successfully');

        // Generate tables for each area
        const tablesToInsert = [];

        for (let i = 0; i < insertedAreas.length; i++) {
            const area = insertedAreas[i];
            const areaData = areas[i];
            const tableType = getTableType(area.area_name);
            const seatsPerTable = getSeatsCount(area.area_name, tableType);

            for (let j = 1; j <= areaData.table_count; j++) {
                tablesToInsert.push({
                    table_number: generateTableNumber(area.area_code, j),
                    area_id: area._id,
                    seats: seatsPerTable,
                    table_type: tableType,
                    is_available: true,
                    is_active: true
                });
            }
        }

        // Insert all tables
        await Table.insertMany(tablesToInsert);
        console.log('Tables seeded successfully');

        // Display summary
        console.log('\n=== SEEDING SUMMARY ===');
        for (const area of insertedAreas) {
            const tableCount = await Table.countDocuments({ area_id: area._id });
            console.log(`${area.area_code} - ${area.area_name}: ${tableCount} tables`);
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding areas and tables:', error);
        process.exit(1);
    }
}

seedAreasAndTables(); 