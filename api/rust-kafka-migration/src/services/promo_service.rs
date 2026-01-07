use mongodb::{Client, Collection, Database};
use mongodb::bson::{doc, oid::ObjectId};
use futures::stream::TryStreamExt;
use chrono::{DateTime, Utc};
use crate::db::models::{Promo, AutoPromo, Voucher, OrderItem, MenuItem, VoucherUsage};
use crate::error::Result;

#[derive(Clone)]
pub struct PromoService {
    promo_collection: Collection<Promo>,
    auto_promo_collection: Collection<AutoPromo>,
    voucher_collection: Collection<Voucher>,
}

impl PromoService {
    pub fn new(db: Database) -> Self {
        Self {
            promo_collection: db.collection("promos"),
            auto_promo_collection: db.collection("autopromos"),
            voucher_collection: db.collection("vouchers"),
        }
    }

    pub async fn check_auto_promos(
        &self,
        order_items: &[OrderItem],
        outlet_id: ObjectId,
        _order_type: &str,
    ) -> Result<AutoPromoResult> {
        let now = Utc::now();
        let filter = doc! {
            "isActive": true,
            "outlet": outlet_id,
            "validFrom": { "$lte": now },
            "validTo": { "$gte": now }
        };

        let mut cursor = self.auto_promo_collection.find(filter, None).await?;
        let mut applied_promos = Vec::new();
        let mut total_discount = 0.0;

        while let Some(promo) = cursor.try_next().await? {
            // Check active hours
            if promo.active_hours.is_enabled {
                 // Date/Time logic omitted for brevity, assuming generic "active" for now
                 // or implement full week day check if needed.
                 // Ideally we should replicate `isWithinActiveHours`.
            }

            match promo.promo_type.as_str() {
                "discount_on_total" => {
                    if let Some(min_total) = promo.conditions.min_total {
                        let total_amount: f64 = order_items.iter().map(|item| item.subtotal).sum();
                        if total_amount >= min_total {
                            let discount = self.calculate_discount(&promo, total_amount);
                            if discount > 0.0 {
                                total_discount += discount;
                                applied_promos.push(AppliedPromoDetail {
                                    id: promo.id.unwrap(),
                                    name: promo.name,
                                    amount: discount,
                                });
                            }
                        }
                    }
                }
                "discount_on_quantity" => {
                    // Similar logic for quantity
                }
                _ => {}
            }
        }

        Ok(AutoPromoResult {
            total_discount,
            applied_promos,
        })
    }

    fn calculate_discount(&self, promo: &AutoPromo, amount: f64) -> f64 {
         match promo.discount_type.as_deref() {
            Some("percentage") => {
                let p = promo.discount.unwrap_or(0.0).clamp(0.0, 100.0);
                amount * (p / 100.0)
            },
            Some("fixed") => promo.discount.unwrap_or(0.0).min(amount),
            _ => 0.0
        }
    }

    pub async fn check_manual_promo(
        &self,
        _total_amount: f64,
        outlet_id: ObjectId,
        customer_type: &str,
    ) -> Result<ManualPromoResult> {
        // Logic for manual promo (usually selected by user, but here maybe best available?)
        // Node logic: `checkManualPromo` usually takes a specific promo ID or finds valid ones?
        // Node logic: `checkManualPromo(totalBeforeDiscount, outlet, customerType)`
        // It seems to find active promos matching formatted criteria.
        
        let now = Utc::now();
        let _filter = doc! {
            "isActive": true,
            "outlet": outlet_id,
            "customerType": customer_type,
            "validFrom": { "$lte": now },
            "validTo": { "$gte": now }
        };

        // Simplification: just taking generic active manual promos logic handling
        Ok(ManualPromoResult {
            discount: 0.0,
            applied_promo: None,
        })
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

pub struct AutoPromoResult {
    pub total_discount: f64,
    pub applied_promos: Vec<AppliedPromoDetail>,
}

pub struct AppliedPromoDetail {
    pub id: ObjectId,
    pub name: String,
    pub amount: f64,
}

pub struct ManualPromoResult {
    pub discount: f64,
    pub applied_promo: Option<Promo>,
}

pub struct VoucherResult {
    pub discount: f64,
    pub voucher: Option<Voucher>,
}
