use mongodb::Database;
use bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

use crate::db::models::order::{OrderItem, CustomAmountItem};
use crate::db::models::menu::MenuItem;
use crate::services::{PromoService, TaxService, LoyaltyService};
use crate::error::{AppResult, AppError};

#[derive(Debug, Clone)]
pub struct OrderService {
    db: Database,
    promo_service: PromoService,
    tax_service: TaxService,
    loyalty_service: LoyaltyService,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessOrderItemsRequest {
    pub items: Vec<OrderItemInput>,
    pub outlet: ObjectId,
    pub order_type: String,
    pub voucher_code: Option<String>,
    pub customer_type: Option<String>,
    pub source: String,
    pub customer_id: Option<ObjectId>,
    pub loyalty_points_to_redeem: Option<i32>,
    pub custom_amount_items: Option<Vec<CustomAmountItemInput>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrderItemInput {
    pub id: ObjectId, // Menu item ID
    pub quantity: i32,
    pub selected_toppings: Option<Vec<ToppingSelection>>,
    pub selected_addons: Option<Vec<AddonSelection>>,
    pub notes: Option<String>,
    pub dine_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToppingSelection {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddonSelection {
    pub id: String,
    pub options: Option<Vec<AddonOptionSelection>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AddonOptionSelection {
    pub id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomAmountItemInput {
    pub amount: f64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub dine_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessOrderItemsResult {
    pub order_items: Vec<OrderItem>,
    pub custom_amount_items: Vec<CustomAmountItem>,
    pub totals: OrderTotals,
    pub discounts: OrderDiscounts,
    pub promotions: OrderPromotions,
    pub loyalty: LoyaltyInfo,
    pub taxes_and_fees: Vec<TaxDetail>,
    pub tax_calculation_method: String,
    pub bazar_items_excluded: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderTotals {
    pub before_discount: f64,
    pub after_discount: f64,
    pub total_custom_amount: f64,
    pub total_tax: f64,
    pub total_service_fee: f64,
    pub grand_total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderDiscounts {
    pub auto_promo_discount: f64,
    pub manual_discount: f64,
    pub voucher_discount: f64,
    pub loyalty_discount: f64,
    pub custom_amount_discount: f64,
    pub total: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderPromotions {
    pub applied_promos: Vec<serde_json::Value>,
    pub applied_manual_promo: Option<serde_json::Value>,
    pub applied_voucher: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoyaltyInfo {
    pub points_used: f64,
    pub points_earned: f64,
    pub discount_amount: f64,
    pub loyalty_details: Option<serde_json::Value>,
    pub customer_id: Option<ObjectId>,
    pub is_applied: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaxDetail {
    pub id: ObjectId,
    pub name: String,
    pub tax_type: String,
    pub amount: f64,
    pub percentage: Option<f64>,
    pub fixed_fee: Option<f64>,
    pub applies_to: String,
    pub applicable_amount: f64,
}

impl OrderService {
    pub fn new(db: Database) -> Self {
        let promo_service = PromoService::new(db.clone());
        let tax_service = TaxService::new(db.clone());
        let loyalty_service = LoyaltyService::new(db.clone());

        Self {
            db,
            promo_service,
            tax_service,
            loyalty_service,
        }
    }

    /// Main function to process order items including pricing, promotions, and taxes
    pub async fn process_order_items(
        &self,
        request: ProcessOrderItemsRequest,
    ) -> AppResult<ProcessOrderItemsResult> {
        // Validate input
        if request.items.is_empty() && request.custom_amount_items.as_ref().map_or(true, |v| v.is_empty()) {
            return Err(AppError::Validation("Order items cannot be empty".to_string()));
        }

        let mut order_items = Vec::new();
        let mut total_before_discount = 0.0;

        // Process regular menu items
        for item_input in &request.items {
            if item_input.quantity <= 0 {
                return Err(AppError::Validation(format!(
                    "Invalid item quantity ({}) for item",
                    item_input.quantity
                )));
            }

            // Fetch menu item from database
            let menu_item = self.get_menu_item(item_input.id).await?;
            
            // Fetch recipe for the menu item
            let recipe = self.get_recipe(item_input.id).await?;

            let mut item_price = menu_item.price;
            let mut toppings = Vec::new();
            let mut addons = Vec::new();

            // Process toppings
            if let Some(selected_toppings) = &item_input.selected_toppings {
                let topping_price = self.process_toppings(
                    selected_toppings,
                    &menu_item,
                    &mut toppings,
                ).await?;
                item_price += topping_price;
            }

            // Process addons
            if let Some(selected_addons) = &item_input.selected_addons {
                let addon_price = self.process_addons(
                    selected_addons,
                    &menu_item,
                    &mut addons,
                ).await?;
                item_price += addon_price;
            }

            let subtotal = item_price * item_input.quantity as f64;
            total_before_discount += subtotal;

            // Check if item belongs to Bazar category
            let is_bazar_category = self.check_bazar_category(menu_item.category).await?;

            order_items.push(OrderItem {
                menu_item: Some(item_input.id),
                menu_item_name: menu_item.name.clone(),
                quantity: item_input.quantity,
                price: item_price,
                subtotal,
                addons: addons.clone(),
                toppings: toppings.clone(),
                notes: item_input.notes.clone().unwrap_or_default(),
                is_printed: false,
                dine_type: item_input.dine_type.clone().unwrap_or_else(|| "Dine-In".to_string()),
                is_bazar_category,
                ..Default::default()
            });
        }

        // Process custom amount items
        let mut custom_amount_items_data = Vec::new();
        let mut total_custom_amount = 0.0;

        if let Some(custom_items) = &request.custom_amount_items {
            for item in custom_items {
                let amount = item.amount;
                total_custom_amount += amount;

                custom_amount_items_data.push(CustomAmountItem {
                    amount,
                    name: item.name.clone().unwrap_or_else(|| "Penyesuaian Pembayaran".to_string()),
                    description: item.description.clone().unwrap_or_else(|| "Penyesuaian jumlah pembayaran".to_string()),
                    dine_type: item.dine_type.clone().unwrap_or_else(|| "Dine-In".to_string()),
                    applied_at: chrono::Utc::now(),
                    is_auto_calculated: false,
                });
            }
        }

        let combined_total_before_discount = total_before_discount + total_custom_amount;

        // LOYALTY PROGRAM (optional)
        let mut loyalty_discount = 0.0;
        let mut loyalty_points_used = 0.0;
        let mut loyalty_points_earned = 0.0;
        let mut loyalty_details = None;

        let is_eligible_for_loyalty = request.customer_id.is_some() &&
            (request.source == "app" || request.source == "cashier" || request.source == "Cashier");

        if is_eligible_for_loyalty {
            if let Some(customer_id) = request.customer_id {
                if let Some(points_to_redeem) = request.loyalty_points_to_redeem {
                    if points_to_redeem > 0 {
                        match self.loyalty_service.redeem_loyalty_points(
                            customer_id,
                            points_to_redeem as f64,
                            request.outlet,
                        ).await {
                            Ok((discount, points_used)) => {
                                loyalty_discount = discount;
                                loyalty_points_used = points_used;
                            }
                            Err(e) => {
                                tracing::error!("Loyalty points redemption failed: {:?}", e);
                            }
                        }
                    }
                }
            }
        }

        // Apply all discounts BEFORE tax
        let total_after_loyalty_discount = (combined_total_before_discount - loyalty_discount).max(0.0);

        tracing::info!(
            "PRE-PROMO CALCULATION: menu_items={}, custom_amount={}, combined={}, loyalty_discount={}, after_loyalty={}",
            total_before_discount,
            total_custom_amount,
            combined_total_before_discount,
            loyalty_discount,
            total_after_loyalty_discount
        );

        // Process all discounts before tax
        let promotion_results = self.process_all_discounts_before_tax(
            &order_items,
            request.outlet,
            &request.order_type,
            request.voucher_code.as_deref(),
            request.customer_type.as_deref().unwrap_or("all"),
            total_after_loyalty_discount,
            &request.source,
            &custom_amount_items_data,
        ).await?;

        // Calculate loyalty points earned
        if is_eligible_for_loyalty {
            if let Some(customer_id) = request.customer_id {
                match self.loyalty_service.calculate_loyalty_points(
                    promotion_results.total_after_all_discounts,
                    customer_id,
                    request.outlet,
                ).await {
                    Ok((points_earned, details)) => {
                        loyalty_points_earned = points_earned;
                        loyalty_details = details;
                    }
                    Err(e) => {
                        tracing::error!("Loyalty points calculation failed: {:?}", e);
                    }
                }
            }
        }

        // Apply tax AFTER all discounts - with Bazar category exclusion
        let tax_result = self.tax_service.calculate_taxes_and_services(
            request.outlet,
            promotion_results.total_after_all_discounts,
            &order_items,
            &custom_amount_items_data,
        ).await?;

        // Final grand total with tax
        let grand_total = promotion_results.total_after_all_discounts 
            + tax_result.total_tax 
            + tax_result.total_service_fee;

        tracing::info!(
            "ORDER PROCESSING FINAL: before_discount={}, after_discount={}, tax={}, service={}, grand_total={}",
            combined_total_before_discount,
            promotion_results.total_after_all_discounts,
            tax_result.total_tax,
            tax_result.total_service_fee,
            grand_total
        );

        Ok(ProcessOrderItemsResult {
            order_items,
            custom_amount_items: custom_amount_items_data,
            totals: OrderTotals {
                before_discount: combined_total_before_discount,
                after_discount: promotion_results.total_after_all_discounts,
                total_custom_amount,
                total_tax: tax_result.total_tax,
                total_service_fee: tax_result.total_service_fee,
                grand_total,
            },
            discounts: OrderDiscounts {
                auto_promo_discount: promotion_results.auto_promo_discount,
                manual_discount: promotion_results.manual_discount,
                voucher_discount: promotion_results.voucher_discount,
                loyalty_discount,
                custom_amount_discount: 0.0, // Calculate if needed
                total: promotion_results.total_all_discounts + loyalty_discount,
            },
            promotions: OrderPromotions {
                applied_promos: promotion_results.applied_promos,
                applied_manual_promo: promotion_results.applied_manual_promo,
                applied_voucher: promotion_results.applied_voucher,
            },
            loyalty: LoyaltyInfo {
                points_used: loyalty_points_used,
                points_earned: loyalty_points_earned,
                discount_amount: loyalty_discount,
                loyalty_details,
                customer_id: request.customer_id,
                is_applied: is_eligible_for_loyalty,
            },
            taxes_and_fees: tax_result.tax_details.into_iter().map(|d| TaxDetail {
                id: d.id,
                name: d.name,
                tax_type: d.kind,
                amount: d.amount,
                percentage: d.percentage,
                fixed_fee: d.fixed_fee,
                applies_to: d.applies_to,
                applicable_amount: d.applicable_amount,
            }).collect(),
            tax_calculation_method: "ALL_DISCOUNTS_BEFORE_TAX".to_string(),
            bazar_items_excluded: order_items.iter().filter(|i| i.is_bazar_category).count(),
        })
    }

    /// Process all discounts before tax (auto promo, manual promo, voucher)
    async fn process_all_discounts_before_tax(
        &self,
        order_items: &[OrderItem],
        outlet: ObjectId,
        order_type: &str,
        voucher_code: Option<&str>,
        customer_type: &str,
        total_before_discount: f64,
        source: &str,
        _custom_amount_items: &[CustomAmountItem],
    ) -> AppResult<DiscountResult> {
        let can_use_promo = source == "app" || source == "cashier" || source == "Cashier";

        tracing::info!(
            "ALL DISCOUNTS BEFORE TAX: source={}, can_use_promo={}, has_voucher={}, total={}",
            source,
            can_use_promo,
            voucher_code.is_some(),
            total_before_discount
        );

        // 1. Apply auto promo
        let auto_promo_result = self.promo_service.check_auto_promos(
            order_items,
            outlet,
            order_type,
        ).await?;
        let auto_promo_discount = auto_promo_result.total_discount;

        // 2. Apply manual promo
        let manual_promo_result = if can_use_promo {
            self.promo_service.check_manual_promo(
                total_before_discount,
                outlet,
                customer_type,
            ).await?
        } else {
            crate::services::promo_service::ManualPromoResult {
                discount: 0.0,
                applied_promo: None,
            }
        };
        let manual_discount = manual_promo_result.discount;

        // 3. Apply voucher (after auto & manual promo)
        let subtotal_after_auto_manual = (total_before_discount - auto_promo_discount - manual_discount).max(0.0);

        let voucher_result = if can_use_promo && voucher_code.is_some() {
            self.promo_service.check_voucher(
                voucher_code.unwrap(),
                subtotal_after_auto_manual,
                outlet,
            ).await?
        } else {
            crate::services::promo_service::VoucherResult {
                discount: 0.0,
                voucher: None,
            }
        };
        let voucher_discount = voucher_result.discount;

        // 4. Total all discounts
        let total_all_discounts = auto_promo_discount + manual_discount + voucher_discount;
        let total_after_all_discounts = (total_before_discount - total_all_discounts).max(0.0);

        tracing::info!(
            "DISCOUNTS APPLICATION: auto={}, manual={}, voucher={}, total={}, after={}",
            auto_promo_discount,
            manual_discount,
            voucher_discount,
            total_all_discounts,
            total_after_all_discounts
        );

        Ok(DiscountResult {
            auto_promo_discount,
            manual_discount,
            voucher_discount,
            total_all_discounts,
            total_after_all_discounts,
            applied_promos: auto_promo_result.applied_promos.into_iter()
                .map(|p| serde_json::to_value(p).unwrap_or(serde_json::Value::Null))
                .collect(),
            applied_manual_promo: manual_promo_result.applied_promo
                .map(|p| serde_json::to_value(p).unwrap_or(serde_json::Value::Null)),
            applied_voucher: voucher_result.voucher
                .map(|v| serde_json::to_value(v).unwrap_or(serde_json::Value::Null)),
        })
    }

    /// Process toppings for a menu item
    async fn process_toppings(
        &self,
        selected_toppings: &[ToppingSelection],
        menu_item: &MenuItem,
        toppings_out: &mut Vec<serde_json::Value>,
    ) -> AppResult<f64> {
        let mut total_price = 0.0;

        for topping_sel in selected_toppings {
            // Find topping in menu item
            if let Some(topping_info) = menu_item.toppings.as_ref()
                .and_then(|tops| tops.iter().find(|t| t.id.to_string() == topping_sel.id))
            {
                toppings_out.push(serde_json::json!({
                    "id": topping_sel.id,
                    "name": topping_info.name,
                    "price": topping_info.price
                }));

                total_price += topping_info.price;
            } else {
                tracing::warn!("Topping {} not found in menu item {}", topping_sel.id, menu_item.id);
            }
        }

        Ok(total_price)
    }

    /// Process addons for a menu item
    async fn process_addons(
        &self,
        selected_addons: &[AddonSelection],
        menu_item: &MenuItem,
        addons_out: &mut Vec<serde_json::Value>,
    ) -> AppResult<f64> {
        let mut total_price = 0.0;

        for addon_sel in selected_addons {
            if let Some(addon_info) = menu_item.addons.as_ref()
                .and_then(|adds| adds.iter().find(|a| a.id.to_string() == addon_sel.id))
            {
                if let Some(options) = &addon_sel.options {
                    for option_sel in options {
                        if let Some(option_info) = addon_info.options.as_ref()
                            .and_then(|opts| opts.iter().find(|o| o.id.to_string() == option_sel.id))
                        {
                            addons_out.push(serde_json::json!({
                                "id": addon_sel.id,
                                "name": addon_info.name,
                                "price": option_info.price,
                                "options": [{
                                    "id": option_sel.id,
                                    "label": option_info.label,
                                    "price": option_info.price
                                }]
                            }));

                            total_price += option_info.price;
                        }
                    }
                }
            } else {
                tracing::warn!("Addon {} not found in menu item {}", addon_sel.id, menu_item.id);
            }
        }

        Ok(total_price)
    }

    /// Check if category is Bazar category
    async fn check_bazar_category(&self, category_id: Option<ObjectId>) -> AppResult<bool> {
        if category_id.is_none() {
            return Ok(false);
        }

        let category_id = category_id.unwrap();
        
        // Check hardcoded Bazar category ID
        if category_id.to_string() == "691ab44b8c10cbe7789d7a03" {
            return Ok(true);
        }

        // Fetch category from database
        let collection: mongodb::Collection<bson::Document> = self.db.collection("categories");
        
        match collection.find_one(bson::doc! { "_id": category_id }, None).await {
            Ok(Some(doc)) => {
                if let Ok(name) = doc.get_str("name") {
                    Ok(name == "Bazar")
                } else {
                    Ok(false)
                }
            }
            Ok(None) => Ok(false),
            Err(e) => {
                tracing::error!("Error checking Bazar category: {:?}", e);
                Ok(false)
            }
        }
    }

    /// Get menu item by ID
    async fn get_menu_item(&self, id: ObjectId) -> AppResult<MenuItem> {
        let collection: mongodb::Collection<MenuItem> = self.db.collection("menuitems");
        
        collection.find_one(bson::doc! { "_id": id }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound(format!("Menu item {} not found", id)))
    }

    /// Get recipe by menu item ID
    async fn get_recipe(&self, menu_item_id: ObjectId) -> AppResult<bson::Document> {
        let collection: mongodb::Collection<bson::Document> = self.db.collection("recipes");
        
        collection.find_one(bson::doc! { "menuItemId": menu_item_id }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound(format!("Recipe for menu item {} not found", menu_item_id)))
    }
}

#[derive(Debug)]
struct DiscountResult {
    auto_promo_discount: f64,
    manual_discount: f64,
    voucher_discount: f64,
    total_all_discounts: f64,
    total_after_all_discounts: f64,
    applied_promos: Vec<serde_json::Value>,
    applied_manual_promo: Option<serde_json::Value>,
    applied_voucher: Option<serde_json::Value>,
}
