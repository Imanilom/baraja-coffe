import 'package:barajapos/models/menu_item_model.dart';

List<MenuItemModel> dummyMenuItems = [
  MenuItemModel(
    id: "1",
    name: "Burger Spesial",
    price: 35000,
    description: "Burger dengan daging sapi premium dan keju leleh.",
    // category: "Burger",
    // imageURL: "https://example.com/burger.jpg",
    // toppings: [
    //   ToppingModel(
    //       id: "101",
    //       name: "Extra Cheese",
    //       price: 2000,
    //       createdAt: "2024-03-01"),
    //   ToppingModel(
    //     id: "102",
    //     name: "Bacon",
    //     price: 3000,
    //     createdAt: "2024-03-02",
    //   ),
    // ],
    // addOns: [
    //   AddOnModel(
    //     id: "201",
    //     name: "Side Dish",
    //     type: "multiple",
    //     options: [
    //       AddOnOptionModel(id: "301", label: "French Fries", price: 10000),
    //       AddOnOptionModel(id: "302", label: "Onion Rings", price: 12000),
    //     ],
    //     isActive: true,
    //     createdAt: "2024-03-05",
    //   ),
    //   AddOnModel(
    //     id: "202",
    //     name: "Extra Sauce",
    //     type: "single",
    //     options: [
    //       AddOnOptionModel(id: "303", label: "Garlic Sauce", price: 5.0),
    //       AddOnOptionModel(id: "304", label: "BBQ Sauce", price: 6.0),
    //     ],
    //     isActive: true,
    //     createdAt: "2024-03-05",
    //   ),
    // ],
    // createdAt: "2024-03-01",
    // updatedAt: "2024-03-02",
  ),
  // MenuItemModel(
  //   id: "2",
  //   name: "Pizza Margherita",
  //   price: 54000,
  //   description: "Pizza klasik dengan saus tomat, mozzarella, dan basil.",
  //   category: "Pizza",
  //   imageURL: "https://example.com/pizza.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "103",
  //         name: "Extra Mozzarella",
  //         price: 8.0,
  //         createdAt: "2024-03-01"),
  //   ],
  //   addOns: [
  //     AddOnModel(
  //       id: "202",
  //       name: "Extra Sauce",
  //       type: "single",
  //       options: [
  //         AddOnOptionModel(id: "303", label: "Garlic Sauce", price: 5.0),
  //         AddOnOptionModel(id: "304", label: "BBQ Sauce", price: 6.0),
  //       ],
  //       isActive: true,
  //       createdAt: "2024-03-05",
  //     ),
  //   ],
  //   createdAt: "2024-03-01",
  //   updatedAt: "2024-03-02",
  // ),
  // MenuItemModel(
  //   id: "3",
  //   name: "Spaghetti Carbonara",
  //   price: 25000,
  //   description: "Pasta dengan saus krim, bacon, dan keju parmesan.",
  //   category: "Pasta",
  //   imageURL: "https://example.com/spaghetti.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "104",
  //         name: "Extra Parmesan",
  //         price: 6.0,
  //         createdAt: "2024-03-01"),
  //   ],
  //   addOns: [
  //     AddOnModel(
  //       id: "203",
  //       name: "Additional Meat",
  //       type: "single",
  //       options: [
  //         AddOnOptionModel(id: "305", label: "Grilled Chicken", price: 15.0),
  //         AddOnOptionModel(id: "306", label: "Beef Strips", price: 20.0),
  //       ],
  //       isActive: true,
  //       createdAt: "2024-03-05",
  //     ),
  //   ],
  //   createdAt: "2024-03-01",
  //   updatedAt: "2024-03-02",
  // ),
  // MenuItemModel(
  //   id: "1",
  //   name: "Espresso",
  //   price: 25000,
  //   description: "Kopi hitam pekat dengan rasa kuat dan kaya aroma.",
  //   category: "Coffee",
  //   imageURL: "https://example.com/images/espresso.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t1", name: "Extra Shot", price: 5000, createdAt: "2025-03-11"),
  //     ToppingModel(
  //         id: "t2", name: "Caramel", price: 4000, createdAt: "2025-03-11"),
  //   ],
  //   addOns: [
  //     AddOnModel(
  //       id: "a1",
  //       name: "Milk Choice",
  //       type: "Single Select",
  //       options: [
  //         AddOnOptionModel(id: "o1", label: "Soy Milk", price: 3000),
  //         AddOnOptionModel(id: "o2", label: "Almond Milk", price: 4000),
  //       ],
  //       isActive: true,
  //       createdAt: "2025-03-11",
  //     ),
  //   ],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "2",
  //   name: "Cappuccino",
  //   price: 30000,
  //   description: "Espresso dengan susu steamed dan foam tebal di atasnya.",
  //   category: "Coffee",
  //   imageURL: "https://example.com/images/cappuccino.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t3",
  //         name: "Vanilla Syrup",
  //         price: 5000,
  //         createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "3",
  //   name: "Latte",
  //   price: 32000,
  //   description: "Espresso dengan susu steamed yang lembut dan creamy.",
  //   category: "Coffee",
  //   imageURL: "https://example.com/images/latte.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t3",
  //         name: "Vanilla Syrup",
  //         price: 5000,
  //         createdAt: "2025-03-11"),
  //     ToppingModel(
  //         id: "t4",
  //         name: "Whipped Cream",
  //         price: 4000,
  //         createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "4",
  //   name: "Mocha",
  //   price: 35000,
  //   description: "Espresso dengan campuran coklat dan susu steamed.",
  //   category: "Coffee",
  //   imageURL: "https://example.com/images/mocha.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t4",
  //         name: "Whipped Cream",
  //         price: 4000,
  //         createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "5",
  //   name: "Americano",
  //   price: 22000,
  //   description: "Espresso dengan tambahan air panas untuk rasa lebih ringan.",
  //   category: "Coffee",
  //   imageURL: "https://example.com/images/americano.jpg",
  //   toppings: [],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "6",
  //   name: "Nasi Jamblang",
  //   price: 25000,
  //   description: "Nasi khas Cirebon dibungkus daun jati dengan berbagai lauk.",
  //   category: "Makanan",
  //   imageURL: "https://example.com/images/nasi_jamblang.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t5", name: "Telur Balado", price: 5000, createdAt: "2025-03-11"),
  //     ToppingModel(
  //         id: "t6", name: "Sambal Cumi", price: 7000, createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "7",
  //   name: "Empal Gentong",
  //   price: 35000,
  //   description:
  //       "Gulai daging sapi khas Cirebon yang dimasak dalam gentong tanah liat.",
  //   category: "Makanan",
  //   imageURL: "https://example.com/images/empal_gentong.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t7",
  //         name: "Kerupuk Kulit",
  //         price: 5000,
  //         createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "8",
  //   name: "Tahu Gejrot",
  //   price: 15000,
  //   description: "Tahu goreng dengan bumbu kuah asam manis pedas khas Cirebon.",
  //   category: "Makanan",
  //   imageURL: "https://example.com/images/tahu_gejrot.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t8", name: "Extra Cabai", price: 3000, createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "9",
  //   name: "Docang",
  //   price: 18000,
  //   description:
  //       "Lontong dengan tauge, daun singkong, dan bumbu kacang khas Cirebon.",
  //   category: "Makanan",
  //   imageURL: "https://example.com/images/docang.jpg",
  //   toppings: [],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
  // MenuItemModel(
  //   id: "10",
  //   name: "Mie Koclok",
  //   price: 22000,
  //   description:
  //       "Mie dengan kuah kental berbumbu khas Cirebon, dilengkapi suwiran ayam.",
  //   category: "Makanan",
  //   imageURL: "https://example.com/images/mie_koclok.jpg",
  //   toppings: [
  //     ToppingModel(
  //         id: "t9", name: "Telur Rebus", price: 5000, createdAt: "2025-03-11"),
  //   ],
  //   addOns: [],
  //   createdAt: "2025-03-11",
  //   updatedAt: "2025-03-11",
  // ),
];
