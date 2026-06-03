use serde::{Deserialize, Serialize};
use mongodb::bson::oid::ObjectId;
// No longer using chrono here

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SplitPayment {
    #[serde(rename = "paymentMethod")]
    pub payment_method: String,
    pub amount: f64,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub va_numbers: Vec<VaNumber>,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub actions: Vec<PaymentAction>,
    #[serde(rename = "paymentDetails", default)]
    pub payment_details: Option<PaymentDetails>,
    #[serde(default)]
    pub status: String, // pending, completed, failed, refunded
    #[serde(rename = "processedBy", skip_serializing_if = "Option::is_none")]
    pub processed_by: Option<ObjectId>,
    #[serde(rename = "processedAt", skip_serializing_if = "Option::is_none")]
    pub processed_at: Option<mongodb::bson::DateTime>,
    #[serde(default)]
    pub notes: String,
    #[serde(rename = "refundDetails", skip_serializing_if = "Option::is_none")]
    pub refund_details: Option<RefundDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct VaNumber {
    pub bank: String,
    pub va_number: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PaymentAction {
    pub name: String,
    pub method: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PaymentDetails {
    // Cash
    #[serde(rename = "cashTendered", skip_serializing_if = "Option::is_none")]
    pub cash_tendered: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub change: Option<f64>,
    
    // Card
    #[serde(rename = "cardType", skip_serializing_if = "Option::is_none")]
    pub card_type: Option<String>,
    #[serde(rename = "cardLast4", skip_serializing_if = "Option::is_none")]
    pub card_last4: Option<String>,
    #[serde(rename = "cardTransactionId", skip_serializing_if = "Option::is_none")]
    pub card_transaction_id: Option<String>,

    // QRIS/E-Wallet
    #[serde(rename = "qrCode", skip_serializing_if = "Option::is_none")]
    pub qr_code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ewallets: Option<String>,
    #[serde(rename = "transactionId", skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<String>,

    // Bank Transfer
    #[serde(rename = "bankName", skip_serializing_if = "Option::is_none")]
    pub bank_name: Option<String>,
    #[serde(rename = "accountNumber", skip_serializing_if = "Option::is_none")]
    pub account_number: Option<String>,
    #[serde(rename = "transferReference", skip_serializing_if = "Option::is_none")]
    pub transfer_reference: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct RefundDetails {
    #[serde(rename = "refundAmount", default)]
    pub refund_amount: f64,
    #[serde(rename = "refundReason", skip_serializing_if = "Option::is_none")]
    pub refund_reason: Option<String>,
    #[serde(rename = "refundedAt", skip_serializing_if = "Option::is_none")]
    pub refunded_at: Option<mongodb::bson::DateTime>,
    #[serde(rename = "refundedBy", skip_serializing_if = "Option::is_none")]
    pub refunded_by: Option<ObjectId>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItem {
    #[serde(rename = "menuItem", skip_serializing_if = "Option::is_none")]
    pub menu_item: Option<ObjectId>,
    
    #[serde(rename = "menuItemData", default)]
    pub menu_item_data: MenuItemData,
    
    pub quantity: i32,
    pub subtotal: f64,
    
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub addons: Vec<OrderItemAddon>,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub toppings: Vec<OrderItemTopping>,
    
    #[serde(default)]
    pub notes: String,
    #[serde(rename = "guestName", default)]
    pub guest_name: String,
    #[serde(rename = "batchNumber", default = "default_batch_number")]
    pub batch_number: i32,
    
    #[serde(rename = "addedAt", default = "mongodb::bson::DateTime::now")]
    pub added_at: mongodb::bson::DateTime,
    
    #[serde(rename = "kitchenStatus", default = "default_kitchen_status")]
    pub kitchen_status: String, // pending, printed, cooking, ready, served
    
    #[serde(rename = "isPrinted", default)]
    pub is_printed: bool,
    #[serde(rename = "printedAt", skip_serializing_if = "Option::is_none")]
    pub printed_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "dineType", default = "default_dine_type")]
    pub dine_type: String, // Dine-In, Take Away
    
    #[serde(rename = "outletId", skip_serializing_if = "Option::is_none")]
    pub outlet_id: Option<ObjectId>,
    #[serde(rename = "outletName", skip_serializing_if = "Option::is_none")]
    pub outlet_name: Option<String>,
}


impl Default for OrderItem {
    fn default() -> Self {
        Self {
            menu_item: None,
            menu_item_data: MenuItemData::default(),
            quantity: 0,
            subtotal: 0.0,
            addons: Vec::new(),
            toppings: Vec::new(),
            notes: String::new(),
            guest_name: String::new(),
            batch_number: default_batch_number(),
            added_at: mongodb::bson::DateTime::now(),
            kitchen_status: default_kitchen_status(),
            is_printed: false,
            printed_at: None,
            dine_type: default_dine_type(),
            outlet_id: None,
            outlet_name: None,
        }
    }
}

fn default_batch_number() -> i32 { 1 }
fn default_kitchen_status() -> String { "pending".to_string() }
fn default_dine_type() -> String { "Dine-In".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct MenuItemData {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub price: f64,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub sku: String,
    #[serde(rename = "selectedAddons", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub selected_addons: Vec<OrderItemAddon>,
    #[serde(rename = "selectedToppings", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub selected_toppings: Vec<OrderItemTopping>,
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    #[serde(default)]
    pub workstation: Option<String>,
}

fn default_true() -> bool { true }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct OrderItemAddon {
    pub name: String,
    pub price: f64,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub options: Vec<AddonOption>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AddonOption {
    pub label: String,
    pub price: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct OrderItemTopping {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub name: String,
    pub price: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomAmountItem {
    pub amount: f64,
    #[serde(default = "default_custom_item_name")]
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(rename = "dineType", default = "default_dine_type")]
    pub dine_type: String,
    #[serde(rename = "appliedAt", default = "mongodb::bson::DateTime::now")]
    pub applied_at: mongodb::bson::DateTime,
    #[serde(rename = "originalAmount", skip_serializing_if = "Option::is_none")]
    pub original_amount: Option<f64>,
    #[serde(rename = "discountApplied", default)]
    pub discount_applied: f64,
}

impl Default for CustomAmountItem {
    fn default() -> Self {
        Self {
            amount: 0.0,
            name: default_custom_item_name(),
            description: String::new(),
            dine_type: default_dine_type(),
            applied_at: mongodb::bson::DateTime::now(),
            original_amount: None,
            discount_applied: 0.0,
        }
    }
}

fn default_custom_item_name() -> String { "Penyesuaian Pembayaran".to_string() }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AppliedPromo {
    #[serde(rename = "promoId")]
    pub promo_id: ObjectId,
    #[serde(rename = "promoName", skip_serializing_if = "Option::is_none")]
    pub promo_name: Option<String>,
    #[serde(rename = "promoType", skip_serializing_if = "Option::is_none")]
    pub promo_type: Option<String>,
    #[serde(default)]
    pub discount: f64,
    #[serde(rename = "affectedItems", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub affected_items: Vec<AffectedItem>,
    #[serde(rename = "freeItems", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub free_items: Vec<FreeItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AffectedItem {
    #[serde(rename = "menuItem", skip_serializing_if = "Option::is_none")]
    pub menu_item: Option<ObjectId>,
    #[serde(rename = "menuItemName", skip_serializing_if = "Option::is_none")]
    pub menu_item_name: Option<String>,
    #[serde(default)]
    pub quantity: i32,
    #[serde(rename = "originalSubtotal", default)]
    pub original_subtotal: f64,
    #[serde(rename = "discountAmount", default)]
    pub discount_amount: f64,
    #[serde(rename = "discountedSubtotal", default)]
    pub discounted_subtotal: f64,
    #[serde(rename = "discountPercentage", default)]
    pub discount_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct FreeItem {
    #[serde(rename = "menuItem", skip_serializing_if = "Option::is_none")]
    pub menu_item: Option<ObjectId>,
    #[serde(rename = "menuItemName", skip_serializing_if = "Option::is_none")]
    pub menu_item_name: Option<String>,
    #[serde(default)]
    pub quantity: i32,
    #[serde(default)]
    pub price: f64,
    #[serde(rename = "isFree", default)]
    pub is_free: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct TaxAndService {
    #[serde(rename = "type")]
    pub kind: String, // tax, service
    pub name: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Discounts {
    #[serde(rename = "autoPromoDiscount", default)]
    pub auto_promo_discount: f64,
    #[serde(rename = "manualDiscount", default)]
    pub manual_discount: f64,
    #[serde(rename = "voucherDiscount", default)]
    pub voucher_discount: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatedBy {
    #[serde(rename = "employee_id", default)]
    pub employee_id: Option<ObjectId>,
    #[serde(rename = "employee_name", default)]
    pub employee_name: Option<String>,
    #[serde(rename = "created_at", default = "mongodb::bson::DateTime::now")]
    pub created_at: mongodb::bson::DateTime,
}

impl Default for CreatedBy {
    fn default() -> Self {
        Self {
            employee_id: None,
            employee_name: None,
            created_at: mongodb::bson::DateTime::now(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct DeliveryTracking {
    pub provider: Option<String>,
    pub tracking_number: Option<String>,
    pub status: Option<String>,
    pub driver_name: Option<String>,
    pub driver_phone: Option<String>,
    pub live_tracking_url: Option<String>,
    pub estimated_arrival: Option<mongodb::bson::DateTime>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct RecipientInfo {
    pub name: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub coordinates: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Order {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub order_id: String,
    
    #[serde(rename = "user_id", skip_serializing_if = "Option::is_none")]
    pub user_id: Option<ObjectId>,
    #[serde(default = "default_user")]
    pub user: String,
    
    #[serde(rename = "cashierId", skip_serializing_if = "Option::is_none")]
    pub cashier_id: Option<ObjectId>,
    #[serde(rename = "groId", skip_serializing_if = "Option::is_none")]
    pub gro_id: Option<ObjectId>,
    #[serde(rename = "device_id", skip_serializing_if = "Option::is_none")]
    pub device_id: Option<ObjectId>,
    
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub items: Vec<OrderItem>,
    #[serde(rename = "customAmountItems", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub custom_amount_items: Vec<CustomAmountItem>,
    
    #[serde(default = "default_status")]
    pub status: String, // Pending, Waiting, Reserved, OnProcess, Completed, Canceled
    
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub payments: Vec<SplitPayment>,
    
    // Legacy Payment Method
    #[serde(rename = "paymentMethod", skip_serializing_if = "Option::is_none")]
    pub payment_method: Option<String>,
    
    #[serde(rename = "orderType")]
    pub order_type: String, // 'Dine-In', 'Pickup', 'Delivery', 'Take Away', 'Reservation', 'Event'
    
    #[serde(rename = "deliveryAddress", skip_serializing_if = "Option::is_none")]
    pub delivery_address: Option<String>,
    #[serde(rename = "tableNumber", skip_serializing_if = "Option::is_none")]
    pub table_number: Option<String>,

    #[serde(rename = "tableCode", skip_serializing_if = "Option::is_none")]
    pub table_code: Option<String>,

    #[serde(rename = "guestNumber", skip_serializing_if = "Option::is_none")]
    pub guest_number: Option<i32>,

    #[serde(rename = "pickupTime", skip_serializing_if = "Option::is_none")]
    pub pickup_time: Option<String>,
    
    #[serde(rename = "type", default = "default_type_indoor")]
    pub place_type: String, // Indoor, Outdoor
    
    #[serde(rename = "cancellationReason", skip_serializing_if = "Option::is_none")]
    pub cancellation_reason: Option<String>,
    
    #[serde(rename = "isOpenBill", default)]
    pub is_open_bill: bool,
    
    #[serde(rename = "originalReservationId", skip_serializing_if = "Option::is_none")]
    pub original_reservation_id: Option<ObjectId>,
    
    #[serde(default)]
    pub discounts: Option<Discounts>,
    
    #[serde(rename = "appliedPromos", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub applied_promos: Vec<AppliedPromo>,
    #[serde(rename = "appliedManualPromo", skip_serializing_if = "Option::is_none")]
    pub applied_manual_promo: Option<ObjectId>,
    #[serde(rename = "appliedVoucher", skip_serializing_if = "Option::is_none")]
    pub applied_voucher: Option<ObjectId>,
    
    #[serde(rename = "taxAndServiceDetails", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub tax_and_service_details: Vec<TaxAndService>,
    #[serde(rename = "totalTax", default)]
    pub total_tax: f64,
    #[serde(rename = "totalServiceFee", default)]
    pub total_service_fee: f64,
    
    #[serde(rename = "outlet", skip_serializing_if = "Option::is_none")]
    pub outlet: Option<ObjectId>,
    
    #[serde(rename = "totalBeforeDiscount")]
    pub total_before_discount: f64,
    #[serde(rename = "totalAfterDiscount")]
    pub total_after_discount: f64,
    #[serde(rename = "totalCustomAmount", default)]
    pub total_custom_amount: f64,
    #[serde(rename = "grandTotal")]
    pub grand_total: f64,
    
    #[serde(default)]
    pub change: f64,
    
    pub source: String, // Web, App, Cashier, Waiter, Gro
    
    #[serde(default)]
    pub created_by: Option<CreatedBy>,
    
    #[serde(rename = "currentBatch", default = "default_batch_number")]
    pub current_batch: i32,
    
    #[serde(rename = "lastItemAddedAt", skip_serializing_if = "Option::is_none")]
    pub last_item_added_at: Option<mongodb::bson::DateTime>,
    
    #[serde(rename = "reservation", skip_serializing_if = "Option::is_none")]
    pub reservation: Option<ObjectId>,
    
    #[serde(rename = "createdAtWIB", default = "mongodb::bson::DateTime::now")]
    pub created_at_wib: mongodb::bson::DateTime,
    #[serde(rename = "updatedAtWIB", default = "mongodb::bson::DateTime::now")]
    pub updated_at_wib: mongodb::bson::DateTime,
    
    // Delivery fields
    #[serde(rename = "deliveryStatus", default)]
    pub delivery_status: Option<String>, // Originally default: false (boolean/mixed), but handling as string logic often safer or mapped
    #[serde(rename = "deliveryProvider", default)]
    pub delivery_provider: Option<String>,
     #[serde(rename = "deliveryTracking", skip_serializing_if = "Option::is_none")]
    pub delivery_tracking: Option<DeliveryTracking>,
    #[serde(rename = "recipientInfo", skip_serializing_if = "Option::is_none")]
    pub recipient_info: Option<RecipientInfo>,
    
    #[serde(rename = "isSplitPayment", default)]
    pub is_split_payment: bool,
    #[serde(rename = "splitPaymentStatus", default = "default_split_payment_status")]
    pub split_payment_status: String, // not_started, partial, completed, overpaid
    
    #[serde(rename = "stockRolledBack", default)]
    pub stock_rolled_back: bool,
    #[serde(rename = "tableReleased", default)]
    pub table_released: bool,
    #[serde(rename = "canceledBySystem", default)]
    pub canceled_by_system: bool,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<mongodb::bson::DateTime>,
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<mongodb::bson::DateTime>,
}

fn default_user() -> String { "Guest".to_string() }
fn default_status() -> String { "Pending".to_string() }
fn default_type_indoor() -> String { "Indoor".to_string() }
fn default_split_payment_status() -> String { "not_started".to_string() }

impl Default for Order {
    fn default() -> Self {
        Self {
            id: None,
            order_id: String::new(),
            user_id: None,
            user: default_user(),
            cashier_id: None,
            gro_id: None,
            device_id: None,
            items: Vec::new(),
            custom_amount_items: Vec::new(),
            status: default_status(),
            payments: Vec::new(),
            payment_method: None,
            order_type: String::new(),
            table_code: None,
            guest_number: None,
            delivery_address: None,
            table_number: None,
            pickup_time: None,
            place_type: default_type_indoor(),
            cancellation_reason: None,
            is_open_bill: false,
            original_reservation_id: None,
            discounts: None,
            applied_promos: Vec::new(),
            applied_manual_promo: None,
            applied_voucher: None,
            tax_and_service_details: Vec::new(),
            total_tax: 0.0,
            total_service_fee: 0.0,
            outlet: None,
            total_before_discount: 0.0,
            total_after_discount: 0.0,
            total_custom_amount: 0.0,
            grand_total: 0.0,
            change: 0.0,
            source: String::new(),
            created_by: None,
            current_batch: default_batch_number(),
            last_item_added_at: None,
            reservation: None,
            created_at_wib: mongodb::bson::DateTime::now(),
            updated_at_wib: mongodb::bson::DateTime::now(),
            delivery_status: None,
            delivery_provider: None,
            delivery_tracking: None,
            recipient_info: None,
            is_split_payment: false,
            split_payment_status: default_split_payment_status(),
            stock_rolled_back: false,
            table_released: false,
            canceled_by_system: false,
            created_at: None,
            updated_at: None,
        }
    }
}
