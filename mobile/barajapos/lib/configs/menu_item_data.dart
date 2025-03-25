import 'package:barajapos/models/menu_item_model.dart';

List<MenuItemModel> dummyMenuItems = [
  MenuItemModel(
    id: '3',
    name: 'Nasi Goreng Spesial',
    price: 25000,
    description: 'Nasi goreng dengan campuran ayam, telur, dan sayuran segar.',
    category: ['Nasi', 'Indonesia'],
    imageURL: 'https://example.com/nasi_goreng.jpg',
    toppings: [
      ToppingModel(id: 't5', name: 'Telur Ceplok', price: 5000),
      ToppingModel(id: 't6', name: 'Sate Ayam', price: 7000),
    ],
    addons: [
      AddonModel(
        id: 'a4',
        name: 'Kerupuk',
        type: 'Snack',
        options: [
          AddonOptionModel(id: 'ao7', label: 'Kerupuk Udang', price: 3000),
          AddonOptionModel(id: 'ao8', label: 'Emping', price: 5000),
        ],
      ),
    ],
  ),
  MenuItemModel(
    id: '4',
    name: 'Soto Ayam',
    price: 22000,
    description: 'Soto ayam khas dengan kuah kuning dan sambal segar.',
    category: ['Sup', 'Indonesia'],
    imageURL: 'https://example.com/soto_ayam.jpg',
    toppings: [
      ToppingModel(id: 't7', name: 'Telur Rebus', price: 4000),
      ToppingModel(id: 't8', name: 'Kerupuk', price: 3000),
    ],
    addons: [
      AddonModel(
        id: 'a5',
        name: 'Minuman Pendamping',
        type: 'Drink',
        options: [
          AddonOptionModel(id: 'ao9', label: 'Teh Manis Hangat', price: 5000),
          AddonOptionModel(id: 'ao10', label: 'Es Jeruk', price: 7000),
        ],
      ),
    ],
  ),
  MenuItemModel(
    id: '5',
    name: 'Gado-Gado',
    price: 20000,
    description: 'Salad khas Indonesia dengan bumbu kacang lezat.',
    category: ['Salad', 'Indonesia'],
    imageURL: 'https://example.com/gado_gado.jpg',
    toppings: [
      ToppingModel(id: 't9', name: 'Telur Rebus', price: 5000),
      ToppingModel(id: 't10', name: 'Lontong', price: 4000),
    ],
    addons: [
      AddonModel(
        id: 'a6',
        name: 'Tambahan Sambal',
        type: 'Sauce',
        options: [
          AddonOptionModel(id: 'ao11', label: 'Sambal Biasa', price: 2000),
          AddonOptionModel(
              id: 'ao12', label: 'Sambal Ekstra Pedas', price: 3000),
        ],
      ),
    ],
  ),
  MenuItemModel(
    id: '6',
    name: 'Ayam Penyet',
    price: 27000,
    description: 'Ayam goreng yang dipenyet dengan sambal khas dan lalapan.',
    category: ['Ayam', 'Indonesia'],
    imageURL: 'https://example.com/ayam_penyet.jpg',
    toppings: [
      ToppingModel(id: 't11', name: 'Tempe Goreng', price: 4000),
      ToppingModel(id: 't12', name: 'Tahu Goreng', price: 4000),
    ],
    addons: [
      AddonModel(
        id: 'a7',
        name: 'Sambal Tambahan',
        type: 'Sauce',
        options: [
          AddonOptionModel(id: 'ao13', label: 'Sambal Matah', price: 5000),
          AddonOptionModel(id: 'ao14', label: 'Sambal Ijo', price: 5000),
        ],
      ),
    ],
  ),
  MenuItemModel(
    id: '7',
    name: 'Bakso Urat',
    price: 23000,
    description: 'Bakso urat kenyal dengan kuah kaldu sapi yang gurih.',
    category: ['Bakso', 'Indonesia'],
    imageURL: 'https://example.com/bakso_urat.jpg',
    toppings: [
      ToppingModel(id: 't13', name: 'Tetelan Sapi', price: 7000),
      ToppingModel(id: 't14', name: 'Pangsit Goreng', price: 5000),
    ],
    addons: [
      AddonModel(
        id: 'a8',
        name: 'Tambahan Mie',
        type: 'Noodle',
        options: [
          AddonOptionModel(id: 'ao15', label: 'Mie Kuning', price: 4000),
          AddonOptionModel(id: 'ao16', label: 'Bihun', price: 4000),
        ],
      ),
    ],
  ),
];
