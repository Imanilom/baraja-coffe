# Reporting System API Documentation

## Overview

Comprehensive reporting API for sales analytics, customer insights, profit/loss analysis, and data export functionality.

---

## Base URL

```
http://localhost:3000/api
```

---

## Sales Reports

### 1. Get All Sales

**Endpoint:** `GET /reports/sales`

**Description:** Retrieve all sales orders.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "order_id": "ORD-2024-001",
      "grandTotal": 150000,
      "status": "Completed"
    }
  ]
}
```

---

### 2. Get Sales Summary

**Endpoint:** `GET /reports/sales/summary`

**Description:** Get sales summary with payment method and order type breakdowns.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |
| cashierId | string | No | Filter by cashier ID |
| outletId | string | No | Filter by outlet ID |
| paymentMethod | string | No | Filter by payment method (comma-separated) |
| orderType | string | No | Filter by order type (comma-separated) |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/sales/summary?startDate=2024-01-01&endDate=2024-01-31&outletId=507f1f77bcf86cd799439011"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 15000000,
      "totalTransactions": 150,
      "avgOrderValue": 100000,
      "totalTax": 1500000,
      "totalServiceFee": 750000,
      "totalDiscount": 500000,
      "totalItems": 450
    },
    "paymentMethodBreakdown": [
      {
        "method": "Cash",
        "amount": 7500000,
        "count": 75,
        "percentage": 50.0
      },
      {
        "method": "QRIS",
        "amount": 5250000,
        "count": 52,
        "percentage": 35.0
      }
    ],
    "orderTypeBreakdown": [
      {
        "type": "Dine-In",
        "count": 100,
        "total": 10000000,
        "percentage": 66.67
      },
      {
        "type": "Take Away",
        "count": 50,
        "total": 5000000,
        "percentage": 33.33
      }
    ]
  }
}
```

---

### 3. Get Cashiers List

**Endpoint:** `GET /reports/sales/cashier-list`

**Description:** Get list of all cashiers.

**Response:**
```json
{
  "success": true,
  "data": {
    "cashiers": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "username": "cashier1",
        "email": "cashier1@example.com"
      }
    ]
  }
}
```

---

### 4. Export Sales to CSV

**Endpoint:** `GET /reports/sales/export-to-csv`

**Description:** Export sales data to CSV file.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| outletId | string | No | Filter by outlet ID |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/sales/export-to-csv?startDate=2024-01-01&endDate=2024-01-31" \
  -o sales_report.csv
```

**Response:** CSV file download

**CSV Format:**
```csv
Order ID,Date,Customer,Order Type,Payment Method,Total Before Discount,Total Discount,Tax,Service Fee,Grand Total
ORD-2024-001,2024-01-15T10:30:00Z,John Doe,Dine-In,Cash,100000,10000,10000,5000,105000
```

---

## Customer Reports

### 5. Get Customer Reports

**Endpoint:** `GET /reports/customers`

**Description:** Get customer list with order insights and pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |
| outlet | string | No | Filter by outlet ID |
| cashierId | string | No | Filter by cashier ID |
| minOrders | integer | No | Minimum order count (default: 1) |
| minSpent | number | No | Minimum spent amount (default: 0) |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Items per page (default: 20) |
| search | string | No | Search by name/email/phone |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/customers?minOrders=5&minSpent=500000&page=1&limit=20"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "customerName": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "orderCount": 25,
      "totalSpent": 2500000,
      "avgOrderValue": 100000,
      "daysSinceLastOrder": 5.2,
      "customerSegment": "Gold"
    }
  ],
  "pagination": {
    "totalCount": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Customer Segments:**
- **VIP:** Total spent ≥ 1,000,000
- **Gold:** Total spent ≥ 500,000
- **Silver:** Total spent ≥ 100,000
- **Bronze:** Total spent < 100,000

---

### 6. Get Customer Insights

**Endpoint:** `GET /reports/customers/insights/overview`

**Description:** Get customer analytics overview with top customers.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |
| outlet | string | No | Filter by outlet ID |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/customers/insights/overview"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 500,
      "totalRevenue": 50000000,
      "uniqueCustomers": 150,
      "avgOrderValue": 100000
    },
    "topCustomers": [
      {
        "customerId": "507f1f77bcf86cd799439011",
        "customerName": "John Doe",
        "totalSpent": 5000000,
        "orderCount": 50
      }
    ]
  }
}
```

---

### 7. Export Customers to CSV

**Endpoint:** `GET /reports/customers/export`

**Description:** Export customer data to CSV file.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/customers/export?startDate=2024-01-01&endDate=2024-01-31" \
  -o customers_report.csv
```

**CSV Format:**
```csv
Customer Name,Order Count,Total Spent,Average Order Value
John Doe,25,2500000.00,100000.00
```

---

## Profit/Loss Reports

### 8. Get Profit & Loss Report

**Endpoint:** `GET /reports/main/profit-loss`

**Description:** Get comprehensive profit and loss report with period breakdown.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| outletId | string | No | Filter by outlet ID |
| groupBy | string | No | Group by (daily/weekly/monthly) |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/main/profit-loss?startDate=2024-01-01&endDate=2024-01-31"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "overallSummary": {
      "totalOrders": 500,
      "totalRevenueBeforeDiscount": 55000000,
      "totalRevenueAfterDiscount": 50000000,
      "totalDiscounts": 5000000,
      "totalTax": 5000000,
      "totalServiceFee": 2500000,
      "totalNetRevenue": 57500000,
      "totalEstimatedCost": 22000000,
      "totalGrossProfit": 28000000,
      "totalNetProfit": 35500000,
      "grossProfitMargin": 56.0,
      "netProfitMargin": 71.0,
      "avgOrderValue": 100000
    },
    "periodBreakdown": [
      {
        "period": "2024-01-01",
        "summary": {
          "totalOrders": 20,
          "totalNetProfit": 1500000,
          "netProfitMargin": 70.0
        }
      }
    ]
  }
}
```

**Calculations:**
- **Estimated Cost:** 40% of total before discount
- **Gross Profit:** Revenue after discount - Estimated cost
- **Net Profit:** Net revenue (after discount + tax + service fee) - Estimated cost
- **Profit Margin:** (Profit / Revenue) × 100

---

### 9. Get Discount Usage Report

**Endpoint:** `GET /reports/main/discount-usage`

**Description:** Analyze discount usage and impact.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |
| outletId | string | No | Filter by outlet ID |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/main/discount-usage?startDate=2024-01-01&endDate=2024-01-31"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 500,
      "ordersWithDiscount": 300,
      "totalDiscountAmount": 5000000,
      "discountPenetrationRate": 60.0,
      "avgDiscountPerOrder": 16666.67
    },
    "breakdown": {
      "autoPromo": {
        "totalAmount": 2000000,
        "percentageOfTotalDiscount": 40.0
      },
      "manual": {
        "totalAmount": 2000000,
        "percentageOfTotalDiscount": 40.0
      },
      "voucher": {
        "totalAmount": 1000000,
        "percentageOfTotalDiscount": 20.0
      }
    }
  }
}
```

---

### 10. Export Profit/Loss to CSV

**Endpoint:** `GET /reports/main/profit-loss/export`

**Description:** Export profit/loss data to CSV file.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |

**Example Request:**
```bash
curl "http://localhost:3000/api/reports/main/profit-loss/export?startDate=2024-01-01&endDate=2024-01-31" \
  -o profit_loss_report.csv
```

**CSV Format:**
```csv
Date,Total Orders,Total Revenue,Total Cost,Total Profit,Profit Margin %
2024-01-01,20,2000000.00,800000.00,1200000.00,60.00
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description"
}
```

**Common Error Codes:**
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

---

## Summary

**Total Endpoints:** 10

**Categories:**
- Sales Reports: 4 endpoints
- Customer Reports: 3 endpoints
- Profit/Loss Reports: 3 endpoints

**Features:**
- ✅ MongoDB aggregation pipelines
- ✅ Date range filtering
- ✅ Multi-dimensional breakdowns
- ✅ Pagination support
- ✅ CSV export functionality
- ✅ Customer segmentation
- ✅ Profit margin calculations

---

## Usage Tips

1. **Date Ranges:** Always use YYYY-MM-DD format
2. **Pagination:** Use page and limit parameters for large datasets
3. **Filters:** Combine multiple filters for specific insights
4. **CSV Export:** Use for offline analysis and reporting
5. **Customer Segments:** Leverage for targeted marketing

**All endpoints are production-ready!** 🚀
