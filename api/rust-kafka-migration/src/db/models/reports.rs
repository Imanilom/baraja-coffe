use serde::{Deserialize, Serialize};
use mongodb::bson::{oid::ObjectId, DateTime};

// ============================================
// SALES REPORT MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesSummary {
    #[serde(rename = "totalSales")]
    pub total_sales: f64,
    
    #[serde(rename = "totalTransactions")]
    pub total_transactions: i32,
    
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
    
    #[serde(rename = "totalTax")]
    pub total_tax: f64,
    
    #[serde(rename = "totalServiceFee")]
    pub total_service_fee: f64,
    
    #[serde(rename = "totalDiscount")]
    pub total_discount: f64,
    
    #[serde(rename = "totalItems")]
    pub total_items: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentBreakdown {
    pub method: String,
    pub amount: f64,
    pub count: i32,
    pub percentage: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub breakdown: Option<Vec<PaymentTypeBreakdown>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentTypeBreakdown {
    #[serde(rename = "paymentType")]
    pub payment_type: String,
    pub amount: f64,
    pub count: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderTypeBreakdown {
    #[serde(rename = "type")]
    pub order_type: String,
    pub count: i32,
    pub total: f64,
    pub percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderDetail {
    #[serde(rename = "orderId")]
    pub order_id: String,
    
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
    
    #[serde(rename = "customerName")]
    pub customer_name: String,
    
    pub cashier: String,
    pub outlet: String,
    
    #[serde(rename = "orderType")]
    pub order_type: String,
    
    #[serde(rename = "tableNumber", skip_serializing_if = "Option::is_none")]
    pub table_number: Option<String>,
    
    #[serde(rename = "paymentMethod")]
    pub payment_method: String,
    
    pub status: String,
    pub items: Vec<OrderItemDetail>,
    pub pricing: OrderPricing,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItemDetail {
    pub name: String,
    pub quantity: i32,
    pub price: f64,
    pub subtotal: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(rename = "selectedAddons", skip_serializing_if = "Option::is_none")]
    pub selected_addons: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderPricing {
    #[serde(rename = "totalBeforeDiscount")]
    pub total_before_discount: f64,
    
    #[serde(rename = "totalDiscount")]
    pub total_discount: f64,
    
    #[serde(rename = "totalTax")]
    pub total_tax: f64,
    
    #[serde(rename = "totalServiceFee")]
    pub total_service_fee: f64,
    
    #[serde(rename = "grandTotal")]
    pub grand_total: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesAnalytics {
    #[serde(rename = "hourlySales")]
    pub hourly_sales: Vec<HourlySales>,
    
    #[serde(rename = "topProducts")]
    pub top_products: Vec<TopProduct>,
    
    #[serde(rename = "peakHours")]
    pub peak_hours: Vec<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HourlySales {
    pub hour: i32,
    #[serde(rename = "totalSales")]
    pub total_sales: f64,
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopProduct {
    pub name: String,
    #[serde(rename = "totalSold")]
    pub total_sold: i32,
    pub revenue: f64,
}

// ============================================
// CUSTOMER REPORT MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerReport {
    #[serde(rename = "userId", skip_serializing_if = "Option::is_none")]
    pub user_id: Option<ObjectId>,
    
    #[serde(rename = "customerName")]
    pub customer_name: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    
    #[serde(rename = "orderCount")]
    pub order_count: i32,
    
    #[serde(rename = "totalSpent")]
    pub total_spent: f64,
    
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
    
    #[serde(rename = "firstOrderDate")]
    pub first_order_date: DateTime,
    
    #[serde(rename = "lastOrderDate")]
    pub last_order_date: DateTime,
    
    #[serde(rename = "daysSinceLastOrder")]
    pub days_since_last_order: f64,
    
    #[serde(rename = "customerSegment")]
    pub customer_segment: String,
    
    #[serde(rename = "preferredPaymentMethod")]
    pub preferred_payment_method: String,
    
    #[serde(rename = "preferredOrderType")]
    pub preferred_order_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerInsights {
    pub overview: CustomerOverview,
    #[serde(rename = "customerSegments")]
    pub customer_segments: Vec<CustomerSegment>,
    #[serde(rename = "topCustomers")]
    pub top_customers: Vec<TopCustomer>,
    #[serde(rename = "monthlyTrend")]
    pub monthly_trend: Vec<MonthlyTrend>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerOverview {
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    #[serde(rename = "uniqueCustomers")]
    pub unique_customers: i32,
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomerSegment {
    pub segment: String,
    pub count: i32,
    #[serde(rename = "totalSpent")]
    pub total_spent: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TopCustomer {
    #[serde(rename = "customerId", skip_serializing_if = "Option::is_none")]
    pub customer_id: Option<ObjectId>,
    #[serde(rename = "customerName")]
    pub customer_name: String,
    #[serde(rename = "totalSpent")]
    pub total_spent: f64,
    #[serde(rename = "orderCount")]
    pub order_count: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MonthlyTrend {
    #[serde(rename = "monthYear")]
    pub month_year: String,
    pub revenue: f64,
    pub orders: i32,
}

// ============================================
// PROFIT/LOSS REPORT MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitLossReport {
    pub period: String,
    pub summary: ProfitLossSummary,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfitLossSummary {
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    
    #[serde(rename = "totalRevenueBeforeDiscount")]
    pub total_revenue_before_discount: f64,
    
    #[serde(rename = "totalRevenueAfterDiscount")]
    pub total_revenue_after_discount: f64,
    
    #[serde(rename = "totalDiscounts")]
    pub total_discounts: f64,
    
    #[serde(rename = "totalTax")]
    pub total_tax: f64,
    
    #[serde(rename = "totalServiceFee")]
    pub total_service_fee: f64,
    
    #[serde(rename = "totalNetRevenue")]
    pub total_net_revenue: f64,
    
    #[serde(rename = "totalEstimatedCost")]
    pub total_estimated_cost: f64,
    
    #[serde(rename = "totalGrossProfit")]
    pub total_gross_profit: f64,
    
    #[serde(rename = "totalNetProfit")]
    pub total_net_profit: f64,
    
    #[serde(rename = "grossProfitMargin")]
    pub gross_profit_margin: f64,
    
    #[serde(rename = "netProfitMargin")]
    pub net_profit_margin: f64,
    
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscountUsageReport {
    pub summary: DiscountSummary,
    pub breakdown: DiscountBreakdown,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscountSummary {
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    
    #[serde(rename = "ordersWithDiscount")]
    pub orders_with_discount: i32,
    
    #[serde(rename = "totalDiscountAmount")]
    pub total_discount_amount: f64,
    
    #[serde(rename = "discountPenetrationRate")]
    pub discount_penetration_rate: f64,
    
    #[serde(rename = "avgDiscountPerOrder")]
    pub avg_discount_per_order: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscountBreakdown {
    #[serde(rename = "autoPromo")]
    pub auto_promo: DiscountTypeDetail,
    pub manual: DiscountTypeDetail,
    pub voucher: DiscountTypeDetail,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiscountTypeDetail {
    #[serde(rename = "totalAmount")]
    pub total_amount: f64,
    
    #[serde(rename = "orderCount")]
    pub order_count: i32,
    
    #[serde(rename = "percentageOfTotalDiscount")]
    pub percentage_of_total_discount: f64,
    
    #[serde(rename = "avgDiscountPerOrder")]
    pub avg_discount_per_order: f64,
}

// ============================================
// CASHIER PERFORMANCE MODELS
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CashierPerformance {
    #[serde(rename = "cashierId")]
    pub cashier_id: ObjectId,
    
    #[serde(rename = "cashierName")]
    pub cashier_name: String,
    
    #[serde(rename = "totalOrders")]
    pub total_orders: i32,
    
    #[serde(rename = "totalRevenue")]
    pub total_revenue: f64,
    
    #[serde(rename = "avgOrderValue")]
    pub avg_order_value: f64,
    
    #[serde(rename = "totalDiscount")]
    pub total_discount: f64,
    
    #[serde(rename = "discountRate")]
    pub discount_rate: f64,
}

// ============================================
// PAGINATION
// ============================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Pagination {
    #[serde(rename = "currentPage")]
    pub current_page: i32,
    
    #[serde(rename = "totalPages")]
    pub total_pages: i32,
    
    #[serde(rename = "totalOrders")]
    pub total_orders: i64,
    
    #[serde(rename = "hasNext")]
    pub has_next: bool,
    
    #[serde(rename = "hasPrev")]
    pub has_prev: bool,
}
