# POS/Cashier System - Complete Implementation Plan

## Overview

Implement complete POS/Cashier functionality in Rust including order management, printer configuration, print tracking, online order acceptance, and webhook handling for payment notifications.

## Features to Implement

### 1. Order Management
- Edit order (add/remove items)
- Confirm order
- Get orders (pending, active, completed)
- Process payments (cash, card, split)
- Order revisions and adjustments

### 2. Printer Management
- Save printer configuration (IP address, MAC address, type)
- Print tracking and logging
- Print failure handling
- Workstation-specific printing (kitchen/bar)

### 3. Online Order Handling
- Accept online orders
- Auto-print to kitchen/bar
- Payment webhook integration

### 4. Cashier Authentication
- Device login flow
- Cashier selection
- Session management

---

## Proposed Changes

### Printer Management

#### [NEW] [db/models/printer.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/db/models/printer.rs)

```rust
pub struct PrinterConfig {
    pub id: Option<ObjectId>,
    pub outlet: ObjectId,
    pub device: Option<ObjectId>,
    pub printer_name: String,
    pub printer_type: PrinterType, // thermal, network, bluetooth
    pub connection_type: ConnectionType, // ip, bluetooth, usb
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub port: Option<i32>,
    pub workstation: String, // kitchen, bar, cashier
    pub is_active: bool,
    pub health_status: HealthStatus,
    pub last_print_at: Option<DateTime<Utc>>,
}

pub enum PrinterType {
    Thermal,
    Network,
    Bluetooth,
    USB,
}

pub enum ConnectionType {
    IP,
    Bluetooth,
    USB,
}

pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Offline,
}

pub struct PrintLog {
    pub id: Option<ObjectId>,
    pub order_id: String,
    pub outlet: ObjectId,
    pub workstation: String,
    pub printer_type: Option<String>,
    pub printer_info: Option<String>,
    pub status: PrintStatus,
    pub attempt_count: i32,
    pub failure_reason: Option<String>,
    pub printed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

pub enum PrintStatus {
    Pending,
    Printing,
    Success,
    Failed,
    Skipped,
}
```

#### [NEW] [handlers/printer.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/printer.rs)

Printer configuration handlers:

- `create_printer_config()` - Register new printer
- `get_printer_configs()` - Get printers by outlet/workstation
- `update_printer_config()` - Update printer settings
- `delete_printer_config()` - Remove printer
- `test_printer_connection()` - Test printer connectivity
- `get_printer_health()` - Get printer health status

Print logging handlers:

- `log_print_attempt()` - Log print attempt
- `log_print_success()` - Log successful print
- `log_print_failure()` - Log print failure
- `get_print_stats()` - Get print statistics
- `get_print_history()` - Get order print history
- `get_problematic_prints()` - Get failed prints report

---

### Order Operations

#### [MODIFY] [handlers/order.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/order.rs)

Add comprehensive order management:

**Get Orders:**
- `get_pending_orders()` - Get pending orders by outlet
- `get_active_orders()` - Get active orders (in-progress)
- `get_completed_orders()` - Get completed orders
- `get_order_by_id()` - Get single order details
- `get_cashier_orders()` - Get orders by cashier
- `get_workstation_orders()` - Get orders for kitchen/bar

**Order Confirmation:**
- `confirm_order()` - Confirm order (Web/App)
- `confirm_order_by_cashier()` - Cashier confirmation
- `batch_confirm_orders()` - Auto-confirm multiple orders

**Order Editing:**
- `edit_order()` - Add/remove items from order
- `delete_order_item()` - Remove specific item
- `update_order_item_quantity()` - Change item quantity

**Payment Processing:**
- `process_payment_cashier()` - Process cashier payment
- `create_final_payment()` - Create final payment record
- `get_payment_status()` - Check payment status

**Order Status:**
- `update_order_status()` - Update overall order status
- `update_item_status()` - Update individual item status
- `bulk_update_items()` - Update multiple items

---

### Webhook Handling

#### [NEW] [handlers/webhook.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/webhook.rs)

Payment webhook handlers:

- `midtrans_webhook()` - Handle Midtrans payment notifications
- `handle_payment_success()` - Process successful payment
- `handle_payment_failure()` - Process failed payment
- `verify_webhook_signature()` - Verify webhook authenticity

---

### Order Revision

#### [NEW] [handlers/order_revision.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/order_revision.rs)

Order revision handlers:

- `create_revision()` - Create order revision
- `capture_adjustment()` - Capture payment adjustment
- `settle_payment()` - Settle final payment

#### [NEW] [db/models/order_revision.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/db/models/order_revision.rs)

```rust
pub struct OrderRevision {
    pub id: Option<ObjectId>,
    pub order_id: ObjectId,
    pub revision_number: i32,
    pub changes: Vec<RevisionChange>,
    pub reason: String,
    pub created_by: ObjectId,
    pub created_at: DateTime<Utc>,
}

pub struct RevisionChange {
    pub change_type: ChangeType,
    pub item_id: Option<ObjectId>,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
}

pub enum ChangeType {
    ItemAdded,
    ItemRemoved,
    QuantityChanged,
    PriceAdjusted,
    DiscountApplied,
}
```

---

### Workstation Management

#### [NEW] [handlers/workstation.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/workstation.rs)

Kitchen/Bar workstation handlers:

- `get_kitchen_orders()` - Get kitchen orders
- `get_bar_orders()` - Get bar orders by type
- `update_kitchen_item_status()` - Update kitchen item
- `update_bar_item_status()` - Update bar item
- `bulk_update_kitchen_items()` - Bulk update kitchen items

---

### Table Management (GRO)

#### [NEW] [handlers/gro.rs](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/handlers/gro.rs)

Guest Relations Officer features:

- `get_available_tables()` - Get available tables
- `get_table_occupancy()` - Get table occupancy status
- `transfer_order_table()` - Move order to different table
- `get_table_history()` - Get table transfer history
- `bulk_update_table_status()` - Update multiple tables

---

### Cashier Authentication (Already Implemented)

From [cashier.auth.routes.js](file:///d:/Kerjaan/baraja-coffe/api/routes/cashier.auth.routes.js) analysis:

- ✅ `login_outlet()` - Admin login to outlet
- ✅ [get_devices()](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/websocket/socket_state.rs#152-173) - Get available devices
- ✅ `get_cashiers_for_device()` - Get cashiers for device
- ✅ `login_cashier_to_device()` - Login cashier to device
- ✅ `logout_cashier()` - Logout from device
- ✅ [get_active_sessions()](file:///d:/Kerjaan/baraja-coffe/api/rust-kafka-migration/src/services/session_service.rs#180-211) - Get active sessions
- ✅ `force_logout_user()` - Force logout user

**Status:** Already implemented in previous cashier system migration.

---

## Routes Structure

### Printer Routes

```rust
// /api/printers
POST   /printers                    - Create printer config
GET    /printers                    - Get printers by outlet
GET    /printers/:id                - Get printer by ID
PUT    /printers/:id                - Update printer config
DELETE /printers/:id                - Delete printer
POST   /printers/:id/test           - Test printer connection
GET    /printers/:id/health         - Get printer health

// Print Logging
POST   /print/log-attempt           - Log print attempt
POST   /print/log-success           - Log print success
POST   /print/log-failure           - Log print failure
GET    /print/stats                 - Get print statistics
GET    /print/order/:orderId/history - Get order print history
GET    /print/problematic-report    - Get failed prints
```

### Order Routes

```rust
// Order Management
POST   /orders/unified-order        - Create unified order (existing)
GET    /orders/pending/:outletId    - Get pending orders
GET    /orders/active/:outletId     - Get active orders
GET    /orders/:orderId             - Get order by ID
GET    /orders/cashier/:cashierId   - Get cashier orders

// Order Confirmation
POST   /orders/:orderId/confirm     - Confirm order
POST   /orders/:jobId/confirm       - Confirm by cashier
POST   /orders/batch-confirm        - Batch confirm orders

// Order Editing
PATCH  /orders/:orderId/edit        - Edit order
POST   /orders/delete-item          - Delete order item
PUT    /orders/:orderId/items/:itemId/quantity - Update quantity

// Payment
POST   /orders/cashier/process-payment - Process cashier payment
POST   /orders/final-payment        - Create final payment
GET    /orders/:orderId/payment-status - Get payment status

// Status Updates
PUT    /orders/:orderId/status      - Update order status
PUT    /orders/:orderId/items/:itemId/status - Update item status
PUT    /orders/:orderId/items/bulk-update - Bulk update items
```

### Workstation Routes

```rust
// Kitchen/Bar
GET    /workstation/:type/orders    - Get workstation orders
PUT    /workstation/orders/:orderId/status - Update status
GET    /orders/kitchen              - Get kitchen orders
GET    /orders/bar/:barType         - Get bar orders
```

### Webhook Routes

```rust
POST   /webhooks/midtrans           - Midtrans payment webhook
POST   /webhooks/midtrans-reservation - Reservation webhook
```

### Order Revision Routes

```rust
POST   /orders/:orderId/revisions   - Create revision
POST   /payments/adjustments/:id/capture - Capture adjustment
POST   /payments/:paymentId/settle  - Settle payment
```

### Table Management Routes

```rust
GET    /tables/available            - Get available tables
GET    /table-occupancy/:outletId   - Get occupancy status
POST   /orders/:orderId/transfer-table - Transfer table
GET    /orders/:orderId/table-history - Get table history
POST   /tables/bulk-update-status   - Bulk update tables
```

---

## Verification Plan

### Automated Tests

1. **Printer Management Tests**
   ```powershell
   cargo test printer_config
   cargo test print_logging
   ```

2. **Order Management Tests**
   ```powershell
   cargo test order_confirmation
   cargo test order_editing
   cargo test payment_processing
   ```

3. **Webhook Tests**
   ```powershell
   cargo test midtrans_webhook
   cargo test payment_notifications
   ```

### Manual Testing

1. **Printer Configuration**
   - Register thermal printer with IP address
   - Test printer connection
   - Verify print logging

2. **Order Flow**
   - Create order via cashier
   - Edit order (add/remove items)
   - Confirm order
   - Process payment
   - Verify print to kitchen/bar

3. **Online Order**
   - Receive online order
   - Auto-print to workstation
   - Process payment webhook
   - Confirm order completion

4. **Workstation Display**
   - View kitchen orders
   - Update item status
   - Mark items as ready/served

---

## Implementation Priority

### Phase 1: Core Order Operations (High Priority)
1. Get orders (pending, active, by ID)
2. Confirm order
3. Edit order (add/remove items)
4. Process payment

### Phase 2: Printer Management (High Priority)
1. Printer configuration CRUD
2. Print logging
3. Print statistics

### Phase 3: Workstation Features (Medium Priority)
1. Kitchen/bar order display
2. Item status updates
3. Bulk operations

### Phase 4: Advanced Features (Low Priority)
1. Order revisions
2. Table management
3. Webhook handling
4. Print health monitoring

---

## Dependencies

```toml
[dependencies]
# Existing dependencies...

# For printer communication (if implementing direct printing)
# escpos = "0.1"  # ESC/POS printer protocol
# reqwest = "0.11"  # For HTTP-based printer APIs
```

---

## Notes

> [!IMPORTANT]
> **Print Implementation**: The Node.js version uses `node-thermal-printer` for direct printing. In Rust, we have two options:
> 1. Store printer config and let client handle printing (recommended)
> 2. Implement server-side printing using ESC/POS protocol

> [!WARNING]
> **Webhook Security**: Midtrans webhooks should verify signature to prevent fraud. Implement signature verification using Midtrans server key.

> [!NOTE]
> **Order Editing**: When editing orders, create revision history for audit trail. Store original order state before modifications.
