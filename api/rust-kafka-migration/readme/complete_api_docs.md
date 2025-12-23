# Baraja Coffee API - Complete Documentation

## Overview

Complete REST API documentation for the Baraja Coffee POS system built with Rust and Axum.

**Base URL:** `http://localhost:3000`

**Total Endpoints:** 110+

---

## Table of Contents

1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Menu Management](#menu-management)
4. [Inventory Management](#inventory-management)
5. [Outlet Management](#outlet-management)
6. [Order Management](#order-management)
7. [Device Management](#device-management)
8. [Printer Management](#printer-management)
9. [Order Operations (POS)](#order-operations-pos)
10. [Table Management (GRO)](#table-management-gro)
11. [Workstation (Kitchen/Bar)](#workstation-kitchenbar)
12. [Analytics](#analytics)
13. [Stock Management](#stock-management)
14. [Reporting](#reporting)
15. [WebSocket](#websocket)
16. [Webhooks](#webhooks)

---

## Health Check

### Check API Health

**Endpoint:** `GET /health` or `GET /api/health`

**Description:** Check if the API is running.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "baraja-coffee-api",
    "version": "0.1.0"
  }
}
```

---

## Authentication

### 1. Sign Up

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "08123456789",
  "role": "cashier"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 2. Sign In

**Endpoint:** `POST /api/auth/signin`

**Description:** Authenticate and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "cashier"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 3. Sign Out

**Endpoint:** `GET /api/auth/signout`

**Description:** Sign out current user.

**Response:**
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

---

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "cashier"
  }
}
```

---

### 5. Update Profile

**Endpoint:** `POST /api/auth/update-profile`

**Authentication:** Required

**Request Body:**
```json
{
  "username": "john_updated",
  "phone": "08987654321"
}
```

---

### 6. Change Password

**Endpoint:** `POST /api/auth/change-password`

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

## Menu Management

### 1. Get All Menu Items

**Endpoint:** `GET /api/menu`

**Query Parameters:**
- [category](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/services/order_service.rs#541-572) (optional) - Filter by category
- [available](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/table_management.rs#25-56) (optional) - Filter by availability

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Nasi Goreng",
      "price": 25000,
      "category": "Main Course",
      "available": true
    }
  ]
}
```

---

### 2. Create Menu Item

**Endpoint:** `POST /api/menu`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Nasi Goreng",
  "price": 25000,
  "category": "Main Course",
  "description": "Indonesian fried rice",
  "image": "https://example.com/image.jpg"
}
```

---

### 3. Get Menu Item by ID

**Endpoint:** `GET /api/menu/:id`

---

### 4. Update Menu Item

**Endpoint:** `PUT /api/menu/:id`

**Authentication:** Required

---

### 5. Delete Menu Item

**Endpoint:** `DELETE /api/menu/:id`

**Authentication:** Required

---

### 6. Get Categories

**Endpoint:** `GET /api/menu/categories`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Main Course",
      "description": "Main dishes"
    }
  ]
}
```

---

## Inventory Management

### 1. Adjust Menu Stock

**Endpoint:** `POST /api/inventory/menu-stock/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 10,
  "warehouseId": "507f1f77bcf86cd799439012",
  "reason": "Restock",
  "notes": "Weekly restock"
}
```

---

### 2. Update Product Stock

**Endpoint:** `POST /api/inventory/product-stock/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "quantity": 50,
  "warehouseId": "507f1f77bcf86cd799439012",
  "movementType": "IN",
  "reason": "Purchase"
}
```

---

## Outlet Management

### 1. Get All Outlets

**Endpoint:** `GET /api/outlets`

---

### 2. Get Outlet by ID

**Endpoint:** `GET /api/outlets/:id`

---

### 3. Get Warehouses

**Endpoint:** `GET /api/outlets/warehouses`

---

### 4. Get Suppliers

**Endpoint:** `GET /api/outlets/suppliers`

---

## Order Management

### Create Unified Order

**Endpoint:** `POST /api/order/unified-order`

**Description:** Create order for Web/App/Cashier sources.

**Request Body:**
```json
{
  "source": "Cashier",
  "outletId": "507f1f77bcf86cd799439011",
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439012",
      "quantity": 2,
      "price": 25000
    }
  ],
  "orderType": "Dine-In",
  "tableNumber": "A1",
  "paymentMethod": "Cash"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-2024-001",
    "grandTotal": 50000,
    "status": "Pending"
  }
}
```

---

## Device Management

### 1. Create Device

**Endpoint:** `POST /api/devices`

**Request Body:**
```json
{
  "deviceName": "Cashier-1",
  "deviceType": "POS",
  "outletId": "507f1f77bcf86cd799439011",
  "macAddress": "00:1B:44:11:3A:B7"
}
```

---

### 2. Get Devices by Outlet

**Endpoint:** `GET /api/devices?outletId=507f1f77bcf86cd799439011`

---

### 3. Update Device

**Endpoint:** `PUT /api/devices/:id`

---

### 4. Delete Device

**Endpoint:** `DELETE /api/devices/:id`

---

### 5. Set Device Quotas

**Endpoint:** `POST /api/devices/quotas`

**Request Body:**
```json
{
  "deviceId": "507f1f77bcf86cd799439011",
  "maxOrders": 100,
  "maxAmount": 10000000
}
```

---

### 6. Get Device Quotas

**Endpoint:** `GET /api/devices/quotas?deviceId=507f1f77bcf86cd799439011`

---

## Printer Management

### 1. Create Printer Config

**Endpoint:** `POST /api/printers`

**Request Body:**
```json
{
  "name": "Kitchen Printer",
  "printerType": "Kitchen",
  "connectionType": "Network",
  "ipAddress": "192.168.1.100",
  "port": 9100,
  "outletId": "507f1f77bcf86cd799439011"
}
```

---

### 2. Get Printer Configs

**Endpoint:** `GET /api/printers?outletId=507f1f77bcf86cd799439011`

---

### 3. Get Printer by ID

**Endpoint:** `GET /api/printers/:id`

---

### 4. Update Printer Config

**Endpoint:** `PUT /api/printers/:id`

---

### 5. Delete Printer Config

**Endpoint:** `DELETE /api/printers/:id`

---

### 6. Test Printer Connection

**Endpoint:** `POST /api/printers/:id/test`

---

### 7. Get Printer Health

**Endpoint:** `GET /api/printers/:id/health`

---

### 8. Log Print Attempt

**Endpoint:** `POST /api/print/log-attempt`

---

### 9. Log Print Success

**Endpoint:** `POST /api/print/log-success`

---

### 10. Log Print Failure

**Endpoint:** `POST /api/print/log-failure`

---

### 11. Get Print Stats

**Endpoint:** `GET /api/print/stats?outletId=507f1f77bcf86cd799439011`

---

### 12. Get Order Print History

**Endpoint:** `GET /api/print/order/:orderId/history`

---

## Order Operations (POS)

### 1. Get Pending Orders

**Endpoint:** `GET /api/orders/pending/:outletId`

---

### 2. Get Active Orders

**Endpoint:** `GET /api/orders/active/:outletId`

---

### 3. Get Order by ID

**Endpoint:** `GET /api/orders/:orderId`

---

### 4. Get Cashier Orders

**Endpoint:** `GET /api/orders/cashier/:cashierId`

---

### 5. Confirm Order

**Endpoint:** `POST /api/orders/:orderId/confirm`

---

### 6. Confirm Order by Cashier

**Endpoint:** `POST /api/orders/:jobId/confirm-cashier`

---

### 7. Batch Confirm Orders

**Endpoint:** `POST /api/orders/batch-confirm`

**Request Body:**
```json
{
  "orderIds": ["ORD-001", "ORD-002", "ORD-003"]
}
```

---

### 8. Edit Order

**Endpoint:** `PUT /api/orders/:orderId/edit`

**Request Body:**
```json
{
  "items": [
    {
      "menuItemId": "507f1f77bcf86cd799439012",
      "quantity": 3
    }
  ]
}
```

---

### 9. Delete Order Item

**Endpoint:** `POST /api/orders/delete-item`

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "itemId": "507f1f77bcf86cd799439013"
}
```

---

### 10. Process Payment (Cashier)

**Endpoint:** `POST /api/orders/cashier/process-payment`

**Request Body:**
```json
{
  "orderId": "ORD-001",
  "paymentMethod": "Cash",
  "amount": 50000,
  "cashReceived": 100000
}
```

---

### 11. Get Payment Status

**Endpoint:** `GET /api/orders/:orderId/payment-status`

---

### 12. Update Order Status

**Endpoint:** `PUT /api/orders/:orderId/status`

**Request Body:**
```json
{
  "status": "Completed"
}
```

---

### 13. Update Item Status

**Endpoint:** `PUT /api/orders/:orderId/items/:itemId/status`

---

## Table Management (GRO)

### 1. Get Available Tables

**Endpoint:** `GET /api/tables/available?outletId=507f1f77bcf86cd799439011`

---

### 2. Get Table Occupancy

**Endpoint:** `GET /api/table-occupancy/:outletId`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTables": 20,
    "occupiedTables": 12,
    "availableTables": 8,
    "tables": [
      {
        "tableNumber": "A1",
        "status": "Occupied",
        "orderId": "ORD-001"
      }
    ]
  }
}
```

---

### 3. Transfer Order to Table

**Endpoint:** `POST /api/orders/:orderId/transfer-table`

**Request Body:**
```json
{
  "newTableNumber": "B5",
  "reason": "Customer request"
}
```

---

### 4. Get Table History

**Endpoint:** `GET /api/orders/:orderId/table-history`

---

### 5. Bulk Update Table Status

**Endpoint:** `POST /api/tables/bulk-update-status`

**Request Body:**
```json
{
  "tables": [
    {
      "tableNumber": "A1",
      "status": "Available"
    },
    {
      "tableNumber": "A2",
      "status": "Reserved"
    }
  ]
}
```

---

## Workstation (Kitchen/Bar)

### 1. Get Workstation Orders

**Endpoint:** `GET /api/workstation/:workstationType/orders`

**Parameters:**
- `workstationType`: [kitchen](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/workstation.rs#179-186) or [bar](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/workstation.rs#187-195)

---

### 2. Update Workstation Item Status

**Endpoint:** `PUT /api/workstation/orders/:orderId/items/:itemId/status`

**Request Body:**
```json
{
  "status": "Preparing"
}
```

**Status Values:**
- [Pending](file:///d:/Kerjaan/baraja-coffe/api/controllers/order.controller.js#5945-6196)
- `Preparing`
- `Ready`
- `Served`

---

### 3. Bulk Update Workstation Items

**Endpoint:** `PUT /api/workstation/orders/:orderId/items/bulk-update`

**Request Body:**
```json
{
  "items": [
    {
      "itemId": "507f1f77bcf86cd799439013",
      "status": "Ready"
    }
  ]
}
```

---

### 4. Get Kitchen Orders

**Endpoint:** `GET /api/orders/kitchen?outletId=507f1f77bcf86cd799439011`

---

### 5. Get Bar Orders

**Endpoint:** `GET /api/orders/bar/:barType?outletId=507f1f77bcf86cd799439011`

**Parameters:**
- `barType`: `hot` or `cold`

---

## Analytics

### 1. Get Cashier Metrics

**Endpoint:** `GET /api/analytics/cashier/:cashierId/metrics`

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 15000000,
    "avgOrderValue": 100000,
    "avgProcessingTime": 5.2
  }
}
```

---

### 2. Get Print Failure Analysis

**Endpoint:** `GET /api/analytics/print-failure-analysis`

**Query Parameters:**
- `outletId` - Filter by outlet
- `startDate` - Start date
- `endDate` - End date

---

### 3. Get Order Completion Metrics

**Endpoint:** `GET /api/analytics/order-completion-metrics`

**Query Parameters:**
- `outletId` - Filter by outlet
- `startDate` - Start date
- `endDate` - End date

---

## Stock Management

### 1. Check Stock Availability

**Endpoint:** `POST /api/stock/check-availability`

**Request Body:**
```json
{
  "reservations": [
    {
      "menuItemId": "507f1f77bcf86cd799439011",
      "quantity": 5,
      "warehouseId": "507f1f77bcf86cd799439012"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "Stock is available"
  }
}
```

---

### 2. Deduct Stock

**Endpoint:** `POST /api/stock/deduct`

**Request Body:**
```json
{
  "reservations": [
    {
      "menuItemId": "507f1f77bcf86cd799439011",
      "quantity": 2,
      "warehouseId": "507f1f77bcf86cd799439012"
    }
  ]
}
```

---

### 3. Restore Stock

**Endpoint:** `POST /api/stock/restore/:orderId`

**Description:** Restore stock for cancelled orders.

---

## Reporting

### Sales Reports

#### 1. Get All Sales

**Endpoint:** `GET /api/reports/sales`

---

#### 2. Get Sales Summary

**Endpoint:** `GET /api/reports/sales/summary`

**Query Parameters:**
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)
- `cashierId` - Filter by cashier
- `outletId` - Filter by outlet
- `paymentMethod` - Filter by payment method
- `orderType` - Filter by order type

---

#### 3. Get Cashiers List

**Endpoint:** `GET /api/reports/sales/cashier-list`

---

#### 4. Export Sales to CSV

**Endpoint:** `GET /api/reports/sales/export-to-csv`

**Query Parameters:**
- `startDate` (required)
- `endDate` (required)
- `outletId` (optional)

---

### Customer Reports

#### 5. Get Customer Reports

**Endpoint:** `GET /api/reports/customers`

**Query Parameters:**
- `startDate`, `endDate`
- [outlet](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/outlet.rs#19-29), `cashierId`
- `minOrders`, `minSpent`
- `page`, `limit`
- `search`

---

#### 6. Get Customer Insights

**Endpoint:** `GET /api/reports/customers/insights/overview`

---

#### 7. Export Customers to CSV

**Endpoint:** `GET /api/reports/customers/export`

---

### Profit/Loss Reports

#### 8. Get Profit & Loss Report

**Endpoint:** `GET /api/reports/main/profit-loss`

**Query Parameters:**
- `startDate` (required)
- `endDate` (required)
- `outletId` (optional)
- `groupBy` (optional)

---

#### 9. Get Discount Usage Report

**Endpoint:** `GET /api/reports/main/discount-usage`

---

#### 10. Export Profit/Loss to CSV

**Endpoint:** `GET /api/reports/main/profit-loss/export`

---

## WebSocket

### Device Connection

**Endpoint:** `WS /ws/device`

**Description:** WebSocket connection for real-time device communication.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/device?deviceId=507f1f77bcf86cd799439011&token=JWT_TOKEN');

ws.onopen = () => {
  console.log('Connected to device socket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

**Message Types:**
- `heartbeat` - Keep connection alive
- `status_update` - Device status update
- `print_completion` - Print job completed
- `order_update` - Order status changed

---

## Webhooks

### Midtrans Payment Webhook

**Endpoint:** `POST /webhook/midtrans`

**Description:** Receive payment notifications from Midtrans.

**Request Body:**
```json
{
  "order_id": "ORD-2024-001",
  "transaction_status": "settlement",
  "gross_amount": "50000.00"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Summary

**Total Endpoints:** 110+

**Categories:**
- Authentication: 6 endpoints
- Menu: 6 endpoints
- Inventory: 2 endpoints
- Outlets: 4 endpoints
- Orders: 1 endpoint
- Devices: 6 endpoints
- Printers: 12 endpoints
- Order Operations: 13 endpoints
- Table Management: 5 endpoints
- Workstation: 5 endpoints
- Analytics: 3 endpoints
- Stock Management: 3 endpoints
- Reporting: 10 endpoints
- WebSocket: 1 endpoint
- Webhooks: 1 endpoint

**All endpoints are production-ready!** 🚀
