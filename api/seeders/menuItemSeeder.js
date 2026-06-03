// seeders/menuItemSeeder.js

import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem.model.js';

// Fungsi untuk mendapatkan ObjectId dari category berdasarkan nama
const getCategoryId = async (categoryName) => {
    const category = await mongoose.model('Category').findOne({ name: categoryName });
    return category ? category._id : null;
};

// Fungsi untuk mendapatkan ObjectId dari outlet (asumsi ada outlet default)
const getOutletId = async (outletName = 'Main Outlet') => {
    const outlet = await mongoose.model('Outlet').findOne({ name: outletName });
    return outlet ? outlet._id : null;
};

const menuItemsData = [
    // MAKANAN TAMBAHAN
    {
        name: 'Add Cups',
        price: 2000,
        description: 'Tambahan cup untuk minuman',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 500,
        availableStock: 100
    },
    {
        name: 'Add Flavour',
        price: 7000,
        description: 'Tambahan perasa untuk minuman',
        mainCategory: 'minuman',
        category: 'Additional',
        costPrice: 2000,
        availableStock: 50
    },
    {
        name: 'Add Float',
        price: 7000,
        description: 'Tambahan float untuk minuman',
        mainCategory: 'minuman',
        category: 'Additional',
        costPrice: 2500,
        availableStock: 30
    },
    {
        name: 'Beraja Fresh Juice',
        price: 12500,
        description: 'Jus segar beraja',
        mainCategory: 'minuman',
        category: 'Additional',
        costPrice: 5000,
        availableStock: 20
    },
    {
        name: 'Cup Bamboo',
        price: 55000,
        description: 'Cup bambu ramah lingkungan',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 25000,
        availableStock: 15
    },
    {
        name: 'Add Sauce',
        price: 3000,
        description: 'Tambahan saus',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 800,
        availableStock: 50
    },
    {
        name: 'Extra Cheese',
        price: 7000,
        description: 'Tambahan keju extra',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 3000,
        availableStock: 30
    },
    {
        name: 'Add Ice Cube + Cup',
        price: 2300,
        description: 'Tambahan es batu dan cup',
        mainCategory: 'minuman',
        category: 'Additional',
        costPrice: 700,
        availableStock: 100
    },
    {
        name: 'Add Telor',
        price: 6000,
        description: 'Tambahan telur',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 2000,
        availableStock: 40
    },
    {
        name: 'Add Rice',
        price: 5000,
        description: 'Tambahan nasi',
        mainCategory: 'makanan',
        category: 'Additional',
        costPrice: 1500,
        availableStock: 50
    },

    // APPETIZER
    {
        name: 'Famiglia Patattine Fritte',
        price: 50000,
        description: 'Kentang goreng ala keluarga',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 20000,
        availableStock: 25
    },
    {
        name: 'Tahu Lada Garam',
        price: 30000,
        description: 'Tahu dengan bumbu lada garam',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'French Fries',
        price: 28000,
        description: 'Kentang goreng crispy',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 10000,
        availableStock: 35
    },
    {
        name: 'Caesar Salad with Chicken Grill',
        price: 60000,
        description: 'Salad caesar dengan ayam panggang',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 25000,
        availableStock: 20
    },
    {
        name: 'Fried Mozzarella',
        price: 55000,
        description: 'Mozzarella goreng crispy',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 22000,
        availableStock: 25
    },
    {
        name: 'Potato Cheese Bite',
        price: 45000,
        description: 'Gigitan kentang keju',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 18000,
        availableStock: 30
    },
    {
        name: 'Famiglia Pop & Roll',
        price: 45000,
        description: 'Pop and roll ala famiglia',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 18000,
        availableStock: 25
    },
    {
        name: 'French Fries',
        price: 28000,
        description: 'Kentang goreng standar',
        mainCategory: 'makanan',
        category: 'Appetizer',
        costPrice: 10000,
        availableStock: 35
    },

    // ASIAN FOOD
    {
        name: 'Teriyaki',
        price: 35000,
        description: 'Ayam teriyaki dengan nasi',
        mainCategory: 'makanan',
        category: 'Asian',
        costPrice: 15000,
        availableStock: 30
    },
    {
        name: 'Ayam dan Bebek Goreng',
        price: 40000,
        description: 'Ayam dan bebek goreng crispy',
        mainCategory: 'makanan',
        category: 'Asian',
        costPrice: 18000,
        availableStock: 25
    },
    {
        name: 'Nasi Bebek Goreng',
        price: 47000,
        description: 'Nasi dengan bebek goreng',
        mainCategory: 'makanan',
        category: 'Asian',
        costPrice: 20000,
        availableStock: 20
    },

    // BLACK COFFEE
    {
        name: 'Espresso Single',
        price: 24000,
        description: 'Espresso shot tunggal',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 8000,
        availableStock: 50
    },
    {
        name: 'Espresso Double',
        price: 28000,
        description: 'Espresso shot ganda',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 10000,
        availableStock: 50
    },
    {
        name: 'Hot Americano',
        price: 28000,
        description: 'Americano panas',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 9000,
        availableStock: 40
    },
    {
        name: 'Ice Americano',
        price: 30000,
        description: 'Americano dingin dengan es',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 10000,
        availableStock: 40
    },
    {
        name: 'Hot Long Black',
        price: 32000,
        description: 'Long black panas',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 11000,
        availableStock: 35
    },
    {
        name: 'Hot Manual Brew',
        price: 35000,
        description: 'Manual brew panas',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Ice Manual Brew',
        price: 35000,
        description: 'Manual brew dingin',
        mainCategory: 'minuman',
        category: 'Black Coffee',
        costPrice: 12000,
        availableStock: 30
    },

    // CHOCO SERIES
    {
        name: 'Avocado Chocolate',
        price: 39500,
        description: 'Cokelat alpukat segar',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 15000,
        availableStock: 25
    },
    {
        name: 'Hot Choco Original',
        price: 30000,
        description: 'Cokelat panas original',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Ice Choco Original',
        price: 32000,
        description: 'Cokelat dingin original',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 13000,
        availableStock: 30
    },
    {
        name: 'Hot Choco Vanilla',
        price: 30000,
        description: 'Cokelat vanilla panas',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Ice Choco Vanilla',
        price: 32000,
        description: 'Cokelat vanilla dingin',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 13000,
        availableStock: 30
    },
    {
        name: 'Hot Choco Caramel',
        price: 30000,
        description: 'Cokelat caramel panas',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Ice Choco Caramel',
        price: 32000,
        description: 'Cokelat caramel dingin',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 13000,
        availableStock: 30
    },
    {
        name: 'Ice Choco Mint',
        price: 32000,
        description: 'Cokelat mint dingin',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 13000,
        availableStock: 25
    },
    {
        name: 'Hot Choco Hazelnut',
        price: 32000,
        description: 'Cokelat hazelnut panas',
        mainCategory: 'minuman',
        category: 'Choco Series',
        costPrice: 13000,
        availableStock: 25
    },

    // CIREBON SPECIALTIES
    {
        name: 'Empal Gentong Sirloin',
        price: 78000,
        description: 'Empal gentong dengan daging sirloin',
        mainCategory: 'makanan',
        category: 'Cirebon',
        costPrice: 35000,
        availableStock: 15
    },
    {
        name: 'Nasi Jamblang Peru Balado',
        price: 55000,
        description: 'Nasi jamblang dengan peru balado',
        mainCategory: 'makanan',
        category: 'Cirebon',
        costPrice: 25000,
        availableStock: 20
    },
    {
        name: 'Nasi Jamblang Sirloin Balado',
        price: 75000,
        description: 'Nasi jamblang dengan sirloin balado',
        mainCategory: 'makanan',
        category: 'Cirebon',
        costPrice: 35000,
        availableStock: 15
    },
    {
        name: 'Nasi Jamblang Sirloin Kari',
        price: 75000,
        description: 'Nasi jamblang dengan sirloin kari',
        mainCategory: 'makanan',
        category: 'Cirebon',
        costPrice: 35000,
        availableStock: 15
    },
    {
        name: 'Nasi Lengko Ayam Bakar Madu',
        price: 40000,
        description: 'Nasi lengko dengan ayam bakar madu',
        mainCategory: 'makanan',
        category: 'Cirebon',
        costPrice: 18000,
        availableStock: 25
    },

    // CROISSANT
    {
        name: 'Croissant Butter',
        price: 24800,
        description: 'Croissant dengan butter',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 10000,
        availableStock: 30
    },
    {
        name: 'Croissant Almond',
        price: 31800,
        description: 'Croissant dengan almond',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 25
    },
    {
        name: 'Croissant Nutella',
        price: 33200,
        description: 'Croissant dengan nutella',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 25
    },
    {
        name: 'Croissant Banana Nutella',
        price: 31820,
        description: 'Croissant dengan banana nutella',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Pain Choco',
        price: 30420,
        description: 'Pain au chocolat',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 25
    },
    {
        name: 'Kaough Aman',
        price: 27620,
        description: 'Kue kaough aman tradisional',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 20
    },
    {
        name: 'Cinnamon Roll',
        price: 27620,
        description: 'Roti cinnamon roll',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Croissant Almond Chocolate',
        price: 31820,
        description: 'Croissant dengan almond dan cokelat',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Croissant Banana Choco',
        price: 33200,
        description: 'Croissant dengan banana dan cokelat',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 20
    },
    {
        name: 'Croissant Triple Cheese',
        price: 30420,
        description: 'Croissant dengan triple cheese',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 25
    },
    {
        name: 'Croissant Cheese Cake',
        price: 30420,
        description: 'Croissant dengan cheese cake',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 20
    },
    {
        name: 'Croissant Apple Pie',
        price: 30420,
        description: 'Croissant dengan apple pie',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 20
    },
    {
        name: 'Croissant Ovomaltine',
        price: 31820,
        description: 'Croissant dengan ovomaltine',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Croissant Salted Caramel',
        price: 37420,
        description: 'Croissant dengan salted caramel',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 16000,
        availableStock: 18
    },
    {
        name: 'Croissant Choclate Cheese Cake',
        price: 31820,
        description: 'Croissant dengan chocolate cheese cake',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Banana Slice Cake',
        price: 27600,
        description: 'Kue pisang slice',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Brownies Green Tea',
        price: 27100,
        description: 'Brownies dengan green tea',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 11000,
        availableStock: 20
    },
    {
        name: 'Croissant Brownie Oreo',
        price: 25100,
        description: 'Croissant dengan brownie oreo',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 11000,
        availableStock: 20
    },
    {
        name: 'Croissant Brownie Choco Chips',
        price: 27100,
        description: 'Croissant dengan brownie choco chips',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 20
    },
    {
        name: 'Croissant Pistachio Raspberry',
        price: 45420,
        description: 'Croissant dengan pistachio raspberry',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 20000,
        availableStock: 15
    },
    {
        name: 'Martabak Croissant',
        price: 31820,
        description: 'Martabak dalam bentuk croissant',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Croissant Tiramisu',
        price: 33200,
        description: 'Croissant dengan tiramisu',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 18
    },
    {
        name: 'Croissant Danish Hazelnut',
        price: 36620,
        description: 'Croissant danish dengan hazelnut',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 16000,
        availableStock: 18
    },
    {
        name: 'Belgian Chocolatine',
        price: 33460,
        description: 'Belgian chocolatine',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 20
    },
    {
        name: 'Milo Ovomaltine',
        price: 28560,
        description: 'Milo dengan ovomaltine',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Almond Croissant Sugar',
        price: 34160,
        description: 'Croissant almond dengan gula',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 20
    },
    {
        name: 'Creme Brule Danish',
        price: 33460,
        description: 'Danish dengan creme brule',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 18
    },
    {
        name: 'Japanese Cheesecake',
        price: 28560,
        description: 'Japanese style cheesecake',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 20
    },
    {
        name: 'Chocolate Cinamon',
        price: 30660,
        description: 'Chocolate dengan cinnamon',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 22
    },
    {
        name: 'Croissant Bar Pistachio White Chocolate',
        price: 36987,
        description: 'Croissant bar dengan pistachio white chocolate',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 16000,
        availableStock: 15
    },
    {
        name: 'Croissant Bar Hazelnut Milk Chocolate',
        price: 34187,
        description: 'Croissant bar dengan hazelnut milk chocolate',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 18
    },
    {
        name: 'Croissant Bar Almond Dark Chocolate',
        price: 31387,
        description: 'Croissant bar dengan almond dark chocolate',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Egg Tart Vanila',
        price: 45387,
        description: 'Egg tart dengan vanila',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 20000,
        availableStock: 15
    },
    {
        name: 'Egg Tart Pistachio',
        price: 48187,
        description: 'Egg tart dengan pistachio',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 21000,
        availableStock: 15
    },
    {
        name: 'Gourmandise',
        price: 31387,
        description: 'Gourmandise special',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Tuna Puff',
        price: 28587,
        description: 'Puff dengan tuna',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Smoked Beef',
        price: 31387,
        description: 'Smoked beef',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 14000,
        availableStock: 20
    },
    {
        name: 'Canele Vanilla',
        price: 30629,
        description: 'Canele dengan vanilla',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 13000,
        availableStock: 22
    },
    {
        name: 'Canele Matcha',
        price: 35587,
        description: 'Canele dengan matcha',
        mainCategory: 'dessert',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 20
    },
    {
        name: 'Croissant Cocoa Milk',
        price: 34000,
        description: 'Croissant dengan cocoa milk',
        mainCategory: 'makanan',
        category: 'Croissant',
        costPrice: 15000,
        availableStock: 20
    },

    // DESSERT
    {
        name: 'Lotus Cheese Cake',
        price: 65000,
        description: 'Cheese cake dengan lotus',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 25000,
        availableStock: 15
    },
    {
        name: 'Cheese Cake Berry',
        price: 45000,
        description: 'Cheese cake dengan berry',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 20
    },
    {
        name: 'Cheese Cake Oreo',
        price: 50000,
        description: 'Cheese cake dengan oreo',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 20000,
        availableStock: 18
    },
    {
        name: 'Banana Slice Cake',
        price: 28000,
        description: 'Kue pisang slice',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Banana Grielia',
        price: 28000,
        description: 'Banana grielia special',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 12000,
        availableStock: 25
    },
    {
        name: 'Banana Fritter',
        price: 28000,
        description: 'Pisang goreng fritter',
        mainCategory: 'dessert',
        category: 'Dessert',
        costPrice: 12000,
        availableStock: 30
    },

    // DESSERT
    {
        name: 'Bika Ambon with Vanilla Cream',
        price: 43000,
        description: 'Bika ambon dengan krim vanilla yang lembut',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 25000,
        availableStock: 50
    },
    {
        name: 'Pancake Special',
        price: 47900,
        description: 'Pancake spesial dengan berbagai topping',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 28000,
        availableStock: 30
    },
    {
        name: 'Sweet Potato Creme Brulee',
        price: 35000,
        description: 'Creme brulee dengan rasa ubi manis',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 20000,
        availableStock: 25
    },
    {
        name: 'Mochi Redvelvet Strawberry',
        price: 13600,
        description: 'Mochi dengan rasa red velvet dan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Mochi Matcha Strawberry',
        price: 13600,
        description: 'Mochi dengan rasa matcha dan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Mochi Choco Silverqueen',
        price: 13600,
        description: 'Mochi dengan cokelat Silverqueen',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Mochi Choco Strawberry',
        price: 13600,
        description: 'Mochi dengan cokelat dan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Mochi Redbean Strawberry',
        price: 13600,
        description: 'Mochi dengan red bean dan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Mochi Vanilla Lotus',
        price: 13600,
        description: 'Mochi dengan rasa vanilla dan lotus',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 8000,
        availableStock: 40
    },
    {
        name: 'Cheese Cake Slice Blueberry',
        price: 32200,
        description: 'Potongan cheese cake dengan blueberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 20
    },
    {
        name: 'Cheese Cake Slice Strawberry',
        price: 32200,
        description: 'Potongan cheese cake dengan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 20
    },
    {
        name: 'Cheese Cake Slice Nutella',
        price: 36400,
        description: 'Potongan cheese cake dengan Nutella',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 20000,
        availableStock: 20
    },
    {
        name: 'Cheese Cake Slice Lotus',
        price: 36400,
        description: 'Potongan cheese cake dengan lotus',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 20000,
        availableStock: 20
    },
    {
        name: 'Cheese Cake Slice Brownies',
        price: 35000,
        description: 'Potongan cheese cake dengan brownies',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 19000,
        availableStock: 20
    },
    {
        name: 'Burnt Cheesecake Lotus Biscoff',
        price: 77000,
        description: 'Burnt cheesecake dengan lotus biscoff',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 40000,
        availableStock: 15
    },
    {
        name: 'Single Fudgy Brownies Nutella',
        price: 39100,
        description: 'Brownies fudgy dengan Nutella',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 22000,
        availableStock: 30
    },
    {
        name: 'Single Fudgy Brownies Lotus',
        price: 39100,
        description: 'Brownies fudgy dengan lotus',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 22000,
        availableStock: 30
    },
    {
        name: 'Mille Crepes Lotus Biscoff',
        price: 30800,
        description: 'Mille crepes dengan lotus biscoff',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Silverqueen',
        price: 30800,
        description: 'Mille crepes dengan Silverqueen',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Strawberry',
        price: 30800,
        description: 'Mille crepes dengan strawberry',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 18000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Matcha',
        price: 28000,
        description: 'Mille crepes dengan matcha',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 16000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Cheese',
        price: 28000,
        description: 'Mille crepes dengan cheese',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 16000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Caramel',
        price: 28000,
        description: 'Mille crepes dengan caramel',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 16000,
        availableStock: 25
    },
    {
        name: 'Mille Crepes Red Velvet',
        price: 25300,
        description: 'Mille crepes dengan red velvet',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 15000,
        availableStock: 25
    },
    {
        name: 'Red Velvet Cake',
        price: 47500,
        description: 'Kue red velvet yang lembut',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 26000,
        availableStock: 20
    },
    {
        name: 'Lotus Biscoff',
        price: 44500,
        description: 'Kue dengan lotus biscoff',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 25000,
        availableStock: 20
    },
    {
        name: 'Burn Cheese Cake Matcha',
        price: 41500,
        description: 'Burnt cheese cake dengan matcha',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 23000,
        availableStock: 20
    },
    {
        name: 'Devil\'s Choco Cake',
        price: 44500,
        description: 'Kue cokelat devil\'s yang rich',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 25000,
        availableStock: 20
    },
    {
        name: 'Coffee Mocha Cake',
        price: 42000,
        description: 'Kue dengan rasa coffee mocha',
        mainCategory: 'makanan',
        category: 'Dessert',
        costPrice: 23000,
        availableStock: 20
    },

    // FRAPPE (continued)
    {
        name: 'Ice Irish Coffee Float',
        price: 40000,
        description: 'Irish coffee float dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 20000,
        availableStock: 50
    },
    {
        name: 'Ice Rhum Coffee Float',
        price: 40000,
        description: 'Rhum coffee float dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 20000,
        availableStock: 50
    },
    {
        name: 'Strawberry Blast',
        price: 30000,
        description: 'Frappe strawberry yang segar',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Candy Series',
        price: 30000,
        description: 'Frappe dengan rasa permen',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },

    // HEMAT
    {
        name: 'Rice Bowl Ayam Telor Asin',
        price: 25000,
        description: 'Nasi dengan ayam dan telur asin',
        mainCategory: 'makanan',
        category: 'Hemat',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Rice Bowl Ayam Lada Hitam',
        price: 25000,
        description: 'Nasi dengan ayam lada hitam',
        mainCategory: 'makanan',
        category: 'Hemat',
        costPrice: 12000,
        availableStock: 30
    },
    {
        name: 'Rice Bowl Chicken Pop Corn',
        price: 25000,
        description: 'Nasi dengan chicken popcorn',
        mainCategory: 'makanan',
        category: 'Hemat',
        costPrice: 12000,
        availableStock: 30
    },

    // INSTAN
    {
        name: 'Hell Braun 200ml',
        price: 30000,
        description: 'Minuman instan Hell Braun 200ml',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 15000,
        availableStock: 100
    },
    {
        name: 'Dunkel Braun 200ml',
        price: 30000,
        description: 'Minuman instan Dunkel Braun 200ml',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 15000,
        availableStock: 100
    },
    {
        name: 'Cold Brew 250ml',
        price: 35000,
        description: 'Cold brew coffee 250ml',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 17000,
        availableStock: 100
    },
    {
        name: 'Hell Braun 1L',
        price: 80000,
        description: 'Minuman instan Hell Braun 1 liter',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 40000,
        availableStock: 50
    },
    {
        name: 'Dunkel Braun 1L',
        price: 80000,
        description: 'Minuman instan Dunkel Braun 1 liter',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 40000,
        availableStock: 50
    },
    {
        name: 'Espresso 1L',
        price: 108000,
        description: 'Espresso 1 liter',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 54000,
        availableStock: 30
    },
    {
        name: 'Mineral Water',
        price: 8000,
        description: 'Air mineral kemasan',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 3000,
        availableStock: 200
    },
    {
        name: 'Hell Braun 250ml',
        price: 35000,
        description: 'Minuman instan Hell Braun 250ml',
        mainCategory: 'minuman',
        category: 'Instan',
        costPrice: 17000,
        availableStock: 100
    },

    // LAINNYA (Others)
    {
        name: 'Produk Cola',
        price: 0,
        description: 'Minuman cola',
        mainCategory: 'minuman',
        category: 'Lainnya',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'Tiket 9 Mei 2025',
        price: 45000,
        description: 'Tiket event 9 Mei 2025',
        mainCategory: 'lainnya',
        category: 'Lainnya',
        costPrice: 0,
        availableStock: 100
    },
    {
        name: 'Khusus Event - Kentang Goreng',
        price: 18182,
        description: 'Kentang goreng untuk event khusus',
        mainCategory: 'makanan',
        category: 'Lainnya',
        costPrice: 8000,
        availableStock: 50
    },
    {
        name: 'Khusus Event - Rice Bowl',
        price: 31818,
        description: 'Rice bowl untuk event khusus',
        mainCategory: 'makanan',
        category: 'Lainnya',
        costPrice: 15000,
        availableStock: 30
    },
    {
        name: 'Tiket 10 Mei 2025',
        price: 50000,
        description: 'Tiket event 10 Mei 2025',
        mainCategory: 'lainnya',
        category: 'Lainnya',
        costPrice: 0,
        availableStock: 100
    },
    {
        name: 'Tiket 17 Mei 2025',
        price: 50000,
        description: 'Tiket event 17 Mei 2025',
        mainCategory: 'lainnya',
        category: 'Lainnya',
        costPrice: 0,
        availableStock: 100
    },
    {
        name: 'Khusus Event - Rice Bowl Hemat',
        price: 27273,
        description: 'Rice bowl hemat untuk event khusus',
        mainCategory: 'makanan',
        category: 'Lainnya',
        costPrice: 12000,
        availableStock: 30
    },

    // MIE GORENG
    {
        name: 'Mie Goreng Kampung',
        price: 50000,
        description: 'Mie goreng dengan bumbu kampung',
        mainCategory: 'makanan',
        category: 'Mie Goreng',
        costPrice: 20000,
        availableStock: 40
    },
    {
        name: 'Mie Nyata Progresif',
        price: 50000,
        description: 'Mie goreng nyata progresif',
        mainCategory: 'makanan',
        category: 'Mie Goreng',
        costPrice: 20000,
        availableStock: 40
    },
    {
        name: 'Mie Jawa',
        price: 35000,
        description: 'Mie goreng khas Jawa',
        mainCategory: 'makanan',
        category: 'Mie Goreng',
        costPrice: 15000,
        availableStock: 40
    },

    // MOCKTAIL
    {
        name: 'Blackheart',
        price: 0,
        description: 'Mocktail blackheart',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'Peachresso',
        price: 0,
        description: 'Mocktail peachresso',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'CO2',
        price: 0,
        description: 'Mocktail CO2',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'Applerrsso',
        price: 31500,
        description: 'Mocktail applerrsso',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Darkrose',
        price: 33000,
        description: 'Mocktail darkrose',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Greenpeace',
        price: 33000,
        description: 'Mocktail greenpeace',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Cinnaout',
        price: 33000,
        description: 'Mocktail cinnaout',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Serberries',
        price: 33000,
        description: 'Mocktail serberries',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Cockberries',
        price: 33000,
        description: 'Mocktail cockberries',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Yellowflow',
        price: 0,
        description: 'Mocktail yellowflow',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'Rosepine',
        price: 32000,
        description: 'Mocktail rosepine',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Bluepine',
        price: 0,
        description: 'Mocktail bluepine',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 0,
        availableStock: 50
    },
    {
        name: 'Molkar',
        price: 28000,
        description: 'Mocktail molkar',
        mainCategory: 'minuman',
        category: 'Mocktail',
        costPrice: 14000,
        availableStock: 50
    },

    // NASI GORENG
    {
        name: 'Nasi Goreng Kampung',
        price: 50000,
        description: 'Nasi goreng dengan bumbu kampung',
        mainCategory: 'makanan',
        category: 'Nasi Goreng',
        costPrice: 20000,
        availableStock: 40
    },
    {
        name: 'Nasi Goreng Seafood',
        price: 40000,
        description: 'Nasi goreng dengan seafood',
        mainCategory: 'makanan',
        category: 'Nasi Goreng',
        costPrice: 18000,
        availableStock: 40
    },
    {
        name: 'Nasi Goreng Ayam',
        price: 40000,
        description: 'Nasi goreng dengan ayam',
        mainCategory: 'makanan',
        category: 'Nasi Goreng',
        costPrice: 18000,
        availableStock: 40
    },

    // NUSANTARA
    {
        name: 'Tongkeng Kambing Muda',
        price: 95000,
        description: 'Tongkeng kambing muda khas nusantara',
        mainCategory: 'makanan',
        category: 'Nusantara',
        costPrice: 45000,
        availableStock: 20
    },
    {
        name: 'Nasi Sale Maranggi with Salad',
        price: 60000,
        description: 'Nasi dengan sale maranggi dan salad',
        mainCategory: 'makanan',
        category: 'Nusantara',
        costPrice: 25000,
        availableStock: 30
    },
    {
        name: 'Nasi Sop Buntut',
        price: 60000,
        description: 'Nasi dengan sop buntut',
        mainCategory: 'makanan',
        category: 'Nusantara',
        costPrice: 25000,
        availableStock: 30
    },

    // FRAPPE (continued)
    {
        name: 'Avocado Gelato',
        price: 39500,
        description: 'Frappe alpukat dengan gelato',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 20000,
        availableStock: 50
    },
    {
        name: 'Iced Green Lime',
        price: 30000,
        description: 'Minuman segar dengan green lime',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50,
        sku: 'IC2001',
        barcode: '100'
    },
    {
        name: 'Rhum Choco',
        price: 30000,
        description: 'Frappe dengan rum dan cokelat',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50,
        sku: 'BL6004',
        barcode: '100'
    },
    {
        name: 'Choco Mint',
        price: 30000,
        description: 'Frappe cokelat dengan mint',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Green Lime',
        price: 30000,
        description: 'Frappe dengan green lime segar',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Ginger Choco',
        price: 30000,
        description: 'Frappe dengan ginger dan cokelat',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Alpenlible',
        price: 30000,
        description: 'Frappe dengan rasa alpenlible',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 15000,
        availableStock: 50
    },
    {
        name: 'Ice Hip-hop Shake',
        price: 32000,
        description: 'Shake ice hip-hop yang unik',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Ice Banana Bali',
        price: 32000,
        description: 'Shake pisang bali dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Ice Banana Florest',
        price: 32000,
        description: 'Shake pisang forest dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Ice Strawberry Milk Shake',
        price: 35000,
        description: 'Milkshake strawberry dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 17000,
        availableStock: 50
    },
    {
        name: 'Ice Choco Milk Shake',
        price: 35000,
        description: 'Milkshake cokelat dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 17000,
        availableStock: 50
    },
    {
        name: 'Ice Vanilla Milk Shake',
        price: 32000,
        description: 'Milkshake vanilla dengan es',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 16000,
        availableStock: 50
    },
    {
        name: 'Ice Insomnia-cino',
        price: 40000,
        description: 'Frappe khusus insomnia-cino',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 20000,
        availableStock: 50
    },
    {
        name: 'Ice Oreo-cino',
        price: 40000,
        description: 'Frappe dengan oreo yang creamy',
        mainCategory: 'minuman',
        category: 'Frappe',
        costPrice: 20000,
        availableStock: 50
    },
    // PASTA
    { name: 'Aglio e Olio Prawn', price: 40000, description: 'Pasta aglio olio dengan udang segar', mainCategory: 'makanan', category: 'Pasta', costPrice: 20000, availableStock: 50 },
    { name: 'Sewa Ruangan Per Jam', price: 350000, description: 'Sewa ruangan per jam untuk acara', mainCategory: 'lainnya', category: 'Ruangan', costPrice: 100000, availableStock: 5 },
    { name: 'Paket Pakungwati (Free 2 minuman)', price: 500000, description: 'Paket makanan Pakungwati dengan 2 minuman gratis', mainCategory: 'makanan', category: 'Ruangan', costPrice: 250000, availableStock: 10 },
    { name: 'Paket Warig Arum (Free 4 minuman)', price: 750000, description: 'Paket makanan Warig Arum dengan 4 minuman gratis', mainCategory: 'makanan', category: 'Ruangan', costPrice: 350000, availableStock: 8 },
    { name: 'Paket Mega Mendung (Free 6 minuman)', price: 999000, description: 'Paket makanan Mega Mendung dengan 6 minuman gratis', mainCategory: 'makanan', category: 'Ruangan', costPrice: 500000, availableStock: 5 },

    // SIGNATURE DRINKS
    { name: 'Hell Braun', price: 30000, description: 'Minuman signature dengan rasa unik', mainCategory: 'minuman', category: 'Signature', costPrice: 15000, availableStock: 30 },
    { name: 'Dunkel Braun', price: 30000, description: 'Minuman signature dengan rasa dunkel', mainCategory: 'minuman', category: 'Signature', costPrice: 15000, availableStock: 30 },
    { name: 'Baraja Latte', price: 30000, description: 'Latte dengan cita rasa khas Baraja', mainCategory: 'minuman', category: 'Signature', costPrice: 15000, availableStock: 30 },
    { name: 'Choco Aren', price: 30000, description: 'Minuman cokelat dengan gula aren', mainCategory: 'minuman', category: 'Signature', costPrice: 15000, availableStock: 30 },
    { name: 'Ginger La Mentea', price: 30000, description: 'Teh jahe dengan campuran unik', mainCategory: 'minuman', category: 'Signature', costPrice: 15000, availableStock: 30 },
    { name: 'Nasi Goreng La Baraja', price: 45000, description: 'Nasi goreng spesial ala Baraja', mainCategory: 'makanan', category: 'signature makanan', costPrice: 25000, availableStock: 20 },

    // TEA & SPIRIT
    { name: 'Hot Lemon Tea', price: 22000, description: 'Teh lemon hangat yang menyegarkan', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 8000, availableStock: 50 },
    { name: 'Ice Lemon Tea', price: 24000, description: 'Teh lemon dingin yang segar', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 8000, availableStock: 50 },
    { name: 'Hot Honey Lime Tea', price: 25000, description: 'Teh madu jeruk nipis hangat', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 10000, availableStock: 40 },
    { name: 'Ice Honey Lime Tea', price: 26000, description: 'Teh madu jeruk nipis dingin', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 10000, availableStock: 40 },
    { name: 'Ginger Hole', price: 28000, description: 'Minuman jahe yang menghangatkan', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 12000, availableStock: 35 },
    { name: 'Markisa Tea', price: 25000, description: 'Teh markisa yang menyegarkan', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 10000, availableStock: 40 },
    { name: 'Hawaiian Tea', price: 28000, description: 'Teh dengan rasa tropis Hawaii', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 12000, availableStock: 35 },
    { name: 'Mojito Lychee', price: 28000, description: 'Mojito dengan rasa leci segar', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 12000, availableStock: 35 },
    { name: 'Mojito Omar', price: 28000, description: 'Mojito spesial dengan rasa unik', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 12000, availableStock: 35 },
    { name: 'Iced Lyche Tea', price: 24000, description: 'Teh leci dingin yang menyegarkan', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 10000, availableStock: 40 },
    { name: 'Blue Freeze', price: 25000, description: 'Minuman biru yang menyegarkan', mainCategory: 'minuman', category: 'Tea & Spirit', costPrice: 10000, availableStock: 40 },

    // WHITE COFFEE
    { name: 'Hot Piccolo', price: 28000, description: 'Piccolo coffee hangat', mainCategory: 'minuman', category: 'White Coffee', costPrice: 12000, availableStock: 40 },
    { name: 'Hot Cappuccino', price: 30000, description: 'Cappuccino hangat klasik', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Ice Cappuccino', price: 33000, description: 'Cappuccino dingin yang segar', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Hot Café Latte', price: 30000, description: 'Café latte hangat dengan susu', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Ice Café Latte', price: 33000, description: 'Café latte dingin yang creamy', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Hot Crème Brule', price: 30000, description: 'Kopi dengan rasa crème brule', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 35 },
    { name: 'Hot Vietnamese Coffee', price: 30000, description: 'Kopi Vietnam yang kental', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 35 },
    { name: 'Hot Vanilla Latte', price: 30000, description: 'Latte dengan rasa vanilla', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Ice Vanilla Latte', price: 35000, description: 'Vanilla latte dingin yang creamy', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 40 },
    { name: 'Hot Buttersweet Latte', price: 30000, description: 'Latte dengan rasa buttersweet', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 35 },
    { name: 'Ice Buttersweet Latte', price: 35000, description: 'Buttersweet latte dingin', mainCategory: 'minuman', category: 'White Coffee', costPrice: 15000, availableStock: 35 },
    { name: 'Hot Caramel Latte', price: 32000, description: 'Latte dengan sirup karamel', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 40 },
    { name: 'Ice Caramel Latte', price: 35000, description: 'Caramel latte dingin yang manis', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 40 },
    { name: 'Hot Hazelnut Latte', price: 32000, description: 'Latte dengan rasa hazelnut', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 35 },
    { name: 'Ice Hazelnut Latte', price: 35000, description: 'Hazelnut latte dingin yang creamy', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 35 },
    { name: 'Hot Tiramisu Latte', price: 32000, description: 'Latte dengan rasa tiramisu', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 35 },
    { name: 'Ice Tiramisu Latte', price: 35000, description: 'Tiramisu latte dingin yang lezat', mainCategory: 'minuman', category: 'White Coffee', costPrice: 16000, availableStock: 35 },

    // BEVERAGES
    { name: 'Hellbraun Bottle', price: 20000, description: 'Minuman Hellbraun dalam botol', mainCategory: 'minuman', category: 'Beverages', costPrice: 8000, availableStock: 60 },
    { name: 'Mineral Water', price: 8000, description: 'Air mineral kemasan', mainCategory: 'minuman', category: 'Beverages', costPrice: 3000, availableStock: 100 },
    { name: 'Chocolate Bottle', price: 25000, description: 'Minuman cokelat dalam botol', mainCategory: 'minuman', category: 'Beverages', costPrice: 12000, availableStock: 40 },
    { name: 'Americano Bottle', price: 20000, description: 'Americano dalam botol', mainCategory: 'minuman', category: 'Beverages', costPrice: 10000, availableStock: 50 },

    // NUSANTARA
    { name: 'Nasi Sop Buntut Bakar', price: 60000, description: 'Nasi dengan sop buntut bakar', mainCategory: 'makanan', category: 'Nusantara', costPrice: 30000, availableStock: 20 },
    { name: 'Nasi Salap Puyung', price: 40000, description: 'Nasi dengan salap puyung khas', mainCategory: 'makanan', category: 'Nusantara', costPrice: 20000, availableStock: 25 },
    { name: 'Gado-gado', price: 35000, description: 'Gado-gado dengan sayuran segar', mainCategory: 'makanan', category: 'Nusantara', costPrice: 18000, availableStock: 30 },

    // OTHER ITEMS
    { name: 'Sujuk', price: 30000, description: 'Sosis tradisional Turki', mainCategory: 'makanan', category: 'Other', costPrice: 15000, availableStock: 20 },
    { name: 'Sujuk', price: 30000, description: 'Sosis tradisional Turki (varian)', mainCategory: 'makanan', category: 'Other', costPrice: 15000, availableStock: 20 },
    { name: 'Hot Matcha', price: 30000, description: 'Matcha hangat yang nikmat', mainCategory: 'minuman', category: 'Other', costPrice: 15000, availableStock: 35 },
    { name: 'Ice Matcha', price: 32000, description: 'Matcha dingin yang menyegarkan', mainCategory: 'minuman', category: 'Other', costPrice: 15000, availableStock: 35 },
    { name: 'Greenlime', price: 28000, description: 'Minuman jeruk nipis hijau', mainCategory: 'minuman', category: 'Other', costPrice: 12000, availableStock: 40 },
    { name: 'Voucher Wardah 150K', price: 150000, description: 'Voucher belanja Wardah senilai 150 ribu', mainCategory: 'lainnya', category: 'Other', costPrice: 140000, availableStock: 10 },
    { name: 'Hampers Anugraha', price: 265700, description: 'Hampers spesial Anugraha', mainCategory: 'lainnya', category: 'Other', costPrice: 200000, availableStock: 5 },
    { name: 'Blue Bear', price: 25000, description: 'Minuman Blue Bear yang unik', mainCategory: 'minuman', category: 'Other', costPrice: 12000, availableStock: 30 },
    { name: 'Spaghetti Carbonara', price: 40000, description: 'Spaghetti carbonara creamy', mainCategory: 'makanan', category: 'Pasta', costPrice: 20000, availableStock: 25 },
    { name: 'Pasta With Rawon Beef', price: 45000, description: 'Pasta dengan daging rawon', mainCategory: 'makanan', category: 'Pasta', costPrice: 25000, availableStock: 20 },

];

// Fungsi untuk menambahkan toppings dan addons umum
const addCommonToppingsAndAddons = (item) => {
    const commonToppings = [];
    const commonAddons = [];

    // Tambahkan toppings berdasarkan kategori
    if (item.mainCategory === 'minuman') {
        commonToppings.push(
            { name: 'Extra Shot', price: 8000 },
            { name: 'Decaf', price: 0 },
            { name: 'Sugar Free', price: 0 },
            { name: 'Extra Ice', price: 0 },
            { name: 'Less Ice', price: 0 },
            { name: 'Extra Sweet', price: 2000 }
        );

        commonAddons.push(
            {
                name: 'Milk Type',
                options: [
                    { label: 'Regular Milk', price: 0, isDefault: true },
                    { label: 'Oat Milk', price: 8000, isDefault: false },
                    { label: 'Soy Milk', price: 6000, isDefault: false },
                    { label: 'Almond Milk', price: 8000, isDefault: false },
                    { label: 'Coconut Milk', price: 7000, isDefault: false }
                ]
            },
            {
                name: 'Size',
                options: [
                    { label: 'Regular', price: 0, isDefault: true },
                    { label: 'Large', price: 5000, isDefault: false },
                    { label: 'Extra Large', price: 10000, isDefault: false }
                ]
            }
        );
    }

    if (item.mainCategory === 'makanan') {
        commonToppings.push(
            { name: 'Extra Sauce', price: 3000 },
            { name: 'Extra Cheese', price: 7000 },
            { name: 'Extra Cream', price: 5000 },
            { name: 'Fresh Fruits', price: 8000 }
        );

        commonAddons.push(
            {
                name: 'Spice Level',
                options: [
                    { label: 'Mild', price: 0, isDefault: true },
                    { label: 'Medium', price: 0, isDefault: false },
                    { label: 'Spicy', price: 0, isDefault: false },
                    { label: 'Extra Spicy', price: 2000, isDefault: false }
                ]
            },
            {
                name: 'Temperature',
                options: [
                    { label: 'Room Temperature', price: 0, isDefault: true },
                    { label: 'Warm', price: 0, isDefault: false },
                    { label: 'Cold', price: 0, isDefault: false }
                ]
            }
        );
    }

    if (item.mainCategory === 'lainnya') {
        // Untuk kategori lainnya seperti tiket, tidak perlu toppings/addons
        return {
            ...item,
            toppings: [],
            addons: []
        };
    }

    return {
        ...item,
        toppings: commonToppings,
        addons: commonAddons
    };
};

export const seedMenuItems = async () => {
    try {
        console.log('🌱 Starting MenuItem seeding...');

        // Hapus semua menu items yang ada
        await MenuItem.deleteMany({});
        console.log('🗑️ Existing menu items cleared');

        // Dapatkan outlet default
        const defaultOutletId = await getOutletId();

        // Proses setiap menu item
        const processedItems = [];

        for (const itemData of menuItemsData) {
            try {
                // Dapatkan category ID berdasarkan nama
                const categoryId = await getCategoryId(itemData.category);

                if (!categoryId) {
                    console.warn(`⚠️ Category '${itemData.category}' not found for item '${itemData.name}'`);
                    continue;
                }

                // Siapkan data menu item
                const menuItemDoc = addCommonToppingsAndAddons({
                    ...itemData,
                    category: categoryId,
                    availableAt: defaultOutletId ? [defaultOutletId] : [],
                    imageURL: `https://placehold.co/600x400/png?text=${encodeURIComponent(itemData.name)}`,
                    isAvailable: true,
                    isRecommended: Math.random() > 0.8, // 20% chance to be recommended
                    preparationTime: item.mainCategory === 'minuman' ? 5 :
                        item.mainCategory === 'makanan' ? 15 : 0, // 5 min for drinks, 15 min for food, 0 for others
                    tags: item.mainCategory === 'minuman' ? ['cold', 'refreshing'] :
                        item.mainCategory === 'makanan' ? ['sweet', 'dessert'] : ['event', 'special']
                });

                delete menuItemDoc.category; // Hapus string category, gunakan ObjectId
                menuItemDoc.category = categoryId;

                processedItems.push(menuItemDoc);

            } catch (error) {
                console.error(`❌ Error processing item '${itemData.name}':`, error.message);
            }
        }

        // Insert semua menu items
        const insertedItems = await MenuItem.insertMany(processedItems);

        console.log(`✅ Successfully seeded ${insertedItems.length} menu items`);
        console.log('📋 Seeded categories:');

        // Tampilkan ringkasan per kategori
        const categorySummary = {};
        insertedItems.forEach(item => {
            const category = item.mainCategory;
            if (!categorySummary[category]) {
                categorySummary[category] = 0;
            }
            categorySummary[category]++;
        });

        Object.entries(categorySummary).forEach(([category, count]) => {
            console.log(`   - ${category}: ${count} items`);
        });

        return insertedItems;

    } catch (error) {
        console.error('❌ Error seeding menu items:', error);
        throw error;
    }
};

// Fungsi untuk menjalankan seeder secara standalone
export const runMenuItemSeeder = async () => {
    try {
        await seedMenuItems();
        console.log('🎉 MenuItem seeding completed successfully!');
    } catch (error) {
        console.error('💥 MenuItem seeding failed:', error);
        process.exit(1);
    }
};

// Jalankan seeder jika file ini dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
    runMenuItemSeeder();
}