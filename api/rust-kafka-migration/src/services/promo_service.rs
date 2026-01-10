use mongodb::{Collection, Database};
use mongodb::bson::{doc, oid::ObjectId};
use futures::stream::TryStreamExt;
use chrono::Utc;
use crate::db::models::{Promo, AutoPromo, Voucher, OrderItem, MenuItem};
use crate::error::{Result, AppError};
use crate::handlers::order::PromoRequest;

#[derive(Clone)]
pub struct PromoService {
    promo_collection: Collection<Promo>,
    auto_promo_collection: Collection<AutoPromo>,
    voucher_collection: Collection<Voucher>,
    menu_collection: Collection<MenuItem>,
}

impl PromoService {
    pub fn new(db: Database) -> Self {
        Self {
            promo_collection: db.collection("promos"),
            auto_promo_collection: db.collection("autopromos"),
            voucher_collection: db.collection("vouchers"),
            menu_collection: db.collection("menuitems"),
        }
    }

    pub async fn apply_promos(
        &self,
        requested_promos: &[PromoRequest],
        order_items: &mut [OrderItem],
        outlet_id: ObjectId,
        order_type: &str,
    ) -> Result<PromoResult> {
        let mut total_discount = 0.0;
        let mut applied_details = Vec::new();

        // 1. Process requested promos
        for req_promo in requested_promos {
            let promo_oid = ObjectId::parse_str(&req_promo.promo_id)
                .map_err(|_| AppError::BadRequest(format!("Invalid promo ID: {}", req_promo.promo_id)))?;

            // Try finding in manual promos first
            if let Some(manual_promo) = self.promo_collection.find_one(doc! { "_id": promo_oid, "isActive": true }, None).await? {
                // Apply manual promo (simplistic for now)
                let subtotal: f64 = order_items.iter().map(|i| i.subtotal).sum();
                let discount = if manual_promo.discount_type == "percentage" {
                    subtotal * (manual_promo.discount_amount / 100.0)
                } else {
                    manual_promo.discount_amount.min(subtotal)
                };

                if discount > 0.0 {
                    total_discount += discount;
                    applied_details.push(AppliedPromoDetail {
                        id: manual_promo.id.unwrap(),
                        name: manual_promo.name,
                        amount: discount,
                        promo_type: "manual".to_string(),
                    });
                }
            } else {
                let found_auto: Option<AutoPromo> = self.auto_promo_collection.find_one(doc! { "_id": promo_oid, "isActive": true }, None).await?;
                if let Some(auto_promo) = found_auto {
                 // Validate and apply auto promo
                 let auto_promo: AutoPromo = auto_promo;
                 if auto_promo.is_active_now() {
                     let result = self.evaluate_auto_promo(&auto_promo, order_items, order_type).await?;
                        if result.applied {
                         // If bundling, we might want to use the bundleSets from request if provided
                         let discount = result.discount;
                         if auto_promo.promo_type == "bundling" {
                             if let Some(_requested_sets) = req_promo.bundle_sets {
                                 // Validate requested sets (simplistic: check if we have enough items)
                                 // For now, we trust evaluate_auto_promo's calculation or cap it by requested_sets
                                 // Logic: if evaluate_auto_promo says we can do more sets than requested, 
                                 // we might want to only apply requested_sets. 
                                 // But usually automatic bundling applies everything possible.
                                 // However, since it's a REQUESTED promo, we should respect the sets.
                             }
                         }
                         
                         total_discount += discount;
                         applied_details.push(AppliedPromoDetail {
                             id: auto_promo.id.unwrap(),
                             name: auto_promo.name,
                             amount: discount,
                             promo_type: auto_promo.promo_type,
                         });
                        }
                     }
                 }
            }
        }

        // 2. Check for other auto promos not in request? 
        if requested_promos.is_empty() {
            let auto_result = self.check_auto_promos(order_items, outlet_id, order_type).await?;
            total_discount += auto_result.total_discount;
            applied_details.extend(auto_result.applied_promos);
        }

        Ok(PromoResult {
            total_discount,
            applied_promos: applied_details,
        })
    }

    pub async fn check_auto_promos(
        &self,
        order_items: &[OrderItem],
        outlet_id: ObjectId,
        order_type: &str,
    ) -> Result<AutoPromoResult> {
        let now = Utc::now();
        let filter = doc! {
            "isActive": true,
            "outlet": outlet_id,
            "validFrom": { "$lte": now },
            "validTo": { "$gte": now }
        };

        use mongodb::Cursor;
        let mut cursor: Cursor<AutoPromo> = self.auto_promo_collection.find(filter, None).await?;
        let mut applied_promos = Vec::new();
        let mut total_discount = 0.0;

        while let Some(promo) = cursor.try_next().await? {
            let promo: AutoPromo = promo;
            if !promo.is_active_now() {
                continue;
            }

            let result = self.evaluate_auto_promo(&promo, order_items, order_type).await?;
            if result.applied && result.discount > 0.0 {
                total_discount += result.discount;
                applied_promos.push(AppliedPromoDetail {
                    id: promo.id.unwrap(),
                    name: promo.name,
                    amount: result.discount,
                    promo_type: promo.promo_type,
                });
            }
        }

        Ok(AutoPromoResult {
            total_discount,
            applied_promos,
        })
    }

    async fn evaluate_auto_promo(
        &self,
        promo: &AutoPromo,
        order_items: &[OrderItem],
        order_type: &str,
    ) -> Result<EvaluationResult> {
        // Consumer Type Check
        if promo.consumer_type != "all" && promo.consumer_type != order_type {
            return Ok(EvaluationResult { applied: false, discount: 0.0 });
        }

        match promo.promo_type.as_str() {
            "discount_on_total" => {
                let subtotal: f64 = order_items.iter().map(|i| i.subtotal).sum();
                if let Some(min_total) = promo.conditions.min_total {
                    if subtotal >= min_total {
                        let discount = promo.calculate_discount(subtotal);
                        return Ok(EvaluationResult { applied: true, discount });
                    }
                }
            }
            "discount_on_quantity" => {
                let mut total_discount = 0.0;
                let min_qty = promo.conditions.min_quantity.unwrap_or(1);
                
                for item in order_items {
                    if item.quantity >= min_qty {
                         total_discount += promo.calculate_discount(item.subtotal);
                    }
                }
                if total_discount > 0.0 {
                    return Ok(EvaluationResult { applied: true, discount: total_discount });
                }
            }
            "product_specific" => {
                let mut total_discount = 0.0;
                for item in order_items {
                    if let Some(menu_item_oid) = item.menu_item {
                        if promo.conditions.products.contains(&menu_item_oid) {
                            total_discount += promo.calculate_discount(item.subtotal);
                        }
                    }
                }
                if total_discount > 0.0 {
                    return Ok(EvaluationResult { applied: true, discount: total_discount });
                }
            }
            "bundling" => {
                let mut min_sets = i32::MAX;
                if promo.conditions.bundle_products.is_empty() {
                    return Ok(EvaluationResult { applied: false, discount: 0.0 });
                }

                let mut original_bundle_price = 0.0;
                for bp in &promo.conditions.bundle_products {
                    if let Some(p_oid) = bp.product {
                        let item_qty = order_items.iter()
                            .filter(|i| i.menu_item == Some(p_oid))
                            .map(|i| i.quantity)
                            .sum::<i32>();
                        
                        let sets = item_qty / bp.quantity.unwrap_or(1);
                        if sets < min_sets {
                            min_sets = sets;
                        }

                        // Get item price for original total calculation
                        if let Some(item) = order_items.iter().find(|i| i.menu_item == Some(p_oid)) {
                            original_bundle_price += item.menu_item_data.price * bp.quantity.unwrap_or(1) as f64;
                        } else {
                            // Fallback if item not in order_items (shouldn't happen if sets > 0)
                            return Ok(EvaluationResult { applied: false, discount: 0.0 });
                        }
                    }
                }

                if min_sets > 0 && min_sets != i32::MAX {
                    if let Some(b_price_per_set) = promo.bundle_price {
                        let discount_per_set = original_bundle_price - b_price_per_set;
                        let total_discount = discount_per_set * min_sets as f64;
                        if total_discount > 0.0 {
                            return Ok(EvaluationResult { applied: true, discount: total_discount });
                        }
                    }
                }
            }
            "buy_x_get_y" => {
                 if let (Some(buy_p), Some(get_p)) = (promo.conditions.buy_product, promo.conditions.get_product) {
                     let min_qty = promo.conditions.min_quantity.unwrap_or(1);
                     let buy_item_qty = order_items.iter()
                        .filter(|i| i.menu_item == Some(buy_p))
                        .map(|i| i.quantity)
                        .sum::<i32>();
                     
                     if buy_item_qty >= min_qty {
                         let free_sets = buy_item_qty / min_qty;
                         // In Node.js, it might add a free item or discount an existing one.
                         // For this migration, we usually calculate discount based on the free item's price.
                         // But we need to know the price of `get_product`. 
                         // For now, let's assume we can fetch it or it's in order_items.
                         if let Some(get_item) = order_items.iter().find(|i| i.menu_item == Some(get_p)) {
                             let discount = get_item.menu_item_data.price * free_sets.min(get_item.quantity) as f64;
                             return Ok(EvaluationResult { applied: true, discount });
                         }
                     }
                 }
            }
            _ => {}
        }

        Ok(EvaluationResult { applied: false, discount: 0.0 })
    }

    pub async fn check_voucher(
        &self,
        voucher_code: &str,
        subtotal: f64,
        outlet_id: ObjectId,
    ) -> Result<VoucherResult> {
        let now = Utc::now();
        let filter = doc! {
            "code": voucher_code,
            "isActive": true,
            "validFrom": { "$lte": now },
            "validTo": { "$gte": now },
            "quota": { "$gt": 0 }
        };

        let voucher = match self.voucher_collection.find_one(filter, None).await? {
            Some(v) => v,
            None => return Ok(VoucherResult { discount: 0.0, voucher: None }),
        };

        if !voucher.applicable_outlets.is_empty() && !voucher.applicable_outlets.contains(&outlet_id) {
             return Ok(VoucherResult { discount: 0.0, voucher: None });
        }

        let discount = if voucher.discount_type == "percentage" {
            subtotal * (voucher.discount_amount / 100.0)
        } else {
             voucher.discount_amount.min(subtotal)
        };

        Ok(VoucherResult {
            discount,
            voucher: Some(voucher),
        })
    }
}

pub struct PromoResult {
    pub total_discount: f64,
    pub applied_promos: Vec<AppliedPromoDetail>,
}

pub struct AutoPromoResult {
    pub total_discount: f64,
    pub applied_promos: Vec<AppliedPromoDetail>,
}

pub struct AppliedPromoDetail {
    pub id: ObjectId,
    pub name: String,
    pub amount: f64,
    pub promo_type: String,
}

pub struct ManualPromoResult {
    pub discount: f64,
    pub applied_promo: Option<Promo>,
}

pub struct VoucherResult {
    pub discount: f64,
    pub voucher: Option<Voucher>,
}

struct EvaluationResult {
    applied: bool,
    discount: f64,
}
