import 'package:barajapos/models/menu_item_model.dart';
import 'package:barajapos/models/order_detail_model.dart';
import 'package:barajapos/models/order_item_model.dart';

List<OrderDetailModel> dummyOrders = [
  OrderDetailModel(
    customerId: "C001",
    customerName: "Andi",
    cashierId: "CSH001",
    phoneNumber: "081234567890",
    items: [
      OrderItemModel(
        menuItem: MenuItemModel(
          id: "M001",
          name: "Burger Spesial",
          price: 35000,
        ),
        quantity: 2,
        selectedAddons: [
          AddOnModel(
            id: "a1",
            name: "Side Dish",
            type: 'single',
            options: [
              AddOnOptionModel(
                id: "a1",
                label: "French Fries",
                price: 10000,
              )
            ],
          )
        ],
        selectedToppings: [
          ToppingModel(id: "t1", name: "Extra Cheese", price: 5000),
        ],
      ),
      OrderItemModel(
        menuItem: MenuItemModel(
          id: "M002",
          name: "Kentang Goreng",
          price: 15000,
        ),
        quantity: 1,
        selectedAddons: [],
        selectedToppings: [],
      ),
    ],
    orderType: "Dine-In",
    tableNumber: 5,
    paymentMethod: "Cash",
    status: "Pending",
    totalPrice: 82000,
  ),
];
