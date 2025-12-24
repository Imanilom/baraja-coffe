use mongodb::{Collection, Database};
use mongodb::bson::{doc, oid::ObjectId};
use mongodb::options::{FindOneOptions, FindOptions};
use futures::stream::TryStreamExt;
use chrono::Utc;
use crate::db::models::{LoyaltyProgram, LoyaltyLevel, CustomerLoyalty};
use crate::error::AppResult;

#[derive(Debug, Clone)]
pub struct LoyaltyService {
    pub _db: Database,
    loyalty_program_collection: Collection<LoyaltyProgram>,
    loyalty_level_collection: Collection<LoyaltyLevel>,
    customer_loyalty_collection: Collection<CustomerLoyalty>,
}

impl LoyaltyService {
    pub fn new(db: Database) -> Self {
        Self {
            loyalty_program_collection: db.collection("loyaltyprograms"),
            loyalty_level_collection: db.collection("loyaltylevels"),
            customer_loyalty_collection: db.collection("customerloyalties"),
            _db: db,
        }
    }

    pub async fn calculate_loyalty_points(
        &self,
        order_amount: f64,
        customer_id: ObjectId,
        outlet_id: ObjectId,
    ) -> AppResult<(f64, Option<serde_json::Value>)> {
        // Find active loyalty program
        let filter = doc! {
            "isActive": true,
            "$or": [
                { "outlet": outlet_id },
                { "outlet": { "$exists": false } }
            ]
        };

        let loyalty_program = match self.loyalty_program_collection.find_one(filter, None).await? {
            Some(program) => program,
            None => return Ok((0.0, None)),
        };

        // Get customer loyalty data
        let customer_filter = doc! {
            "customer": customer_id,
            "loyaltyProgram": loyalty_program.id.unwrap()
        };

        let mut customer_loyalty = match self.customer_loyalty_collection.find_one(customer_filter.clone(), None).await? {
            Some(cl) => cl,
            None => {
                // Create new customer loyalty record
                let new_cl = CustomerLoyalty {
                    id: None,
                    customer: customer_id,
                    loyalty_program: loyalty_program.id.unwrap(),
                    current_points: loyalty_program.registration_points,
                    total_points_earned: loyalty_program.registration_points,
                    total_points_redeemed: 0.0,
                    current_level: None,
                    is_first_transaction: true,
                    last_transaction_date: None,
                    transaction_count: 0,
                    created_at: Some(Utc::now()),
                    updated_at: Some(Utc::now()),
                };
                let insert_result = self.customer_loyalty_collection.insert_one(new_cl.clone(), None).await?;
                let mut created_cl = new_cl;
                created_cl.id = Some(insert_result.inserted_id.as_object_id().unwrap());
                created_cl
            }
        };

        // Calculate base points
        let base_points = (order_amount / loyalty_program.points_per_rp).floor();
        
        let mut bonus_points = 0.0;
        let mut is_first_transaction = false;

        if customer_loyalty.is_first_transaction {
            bonus_points = loyalty_program.first_transaction_points;
            is_first_transaction = true;
            customer_loyalty.is_first_transaction = false;
        }

        let total_points_earned = base_points + bonus_points;

        // Update customer loyalty struct (in memory)
        customer_loyalty.current_points += total_points_earned;
        customer_loyalty.total_points_earned += total_points_earned;
        customer_loyalty.transaction_count += 1;
        customer_loyalty.last_transaction_date = Some(Utc::now());
        customer_loyalty.updated_at = Some(Utc::now());

        // Check and update loyalty level
        let new_level = self.update_loyalty_level(&mut customer_loyalty).await?;

        // Persist updates to DB
        let update_filter = doc! { "_id": customer_loyalty.id.unwrap() };
        let update_doc = doc! {
            "$set": {
                "currentPoints": customer_loyalty.current_points,
                "totalPointsEarned": customer_loyalty.total_points_earned,
                "isFirstTransaction": customer_loyalty.is_first_transaction,
                "transactionCount": customer_loyalty.transaction_count,
                "lastTransactionDate": customer_loyalty.last_transaction_date,
                "currentLevel": customer_loyalty.current_level,
                "updatedAt": customer_loyalty.updated_at
            }
        };
        
        self.customer_loyalty_collection.update_one(update_filter, update_doc, None).await?;

        let loyalty_details = serde_json::json!({
            "basePoints": base_points,
            "bonusPoints": bonus_points,
            "isFirstTransaction": is_first_transaction,
            "currentLevel": new_level,
            "totalPoints": customer_loyalty.current_points,
            "programName": loyalty_program.name
        });

        Ok((total_points_earned, Some(loyalty_details)))
    }

    async fn update_loyalty_level(&self, customer_loyalty: &mut CustomerLoyalty) -> AppResult<Option<LoyaltyLevel>> {
        let sort = doc! { "requiredPoints": 1 };
        let find_options = FindOneOptions::builder().sort(sort.clone()).build();
        let find_many_options = FindOptions::builder().sort(sort).build();

        let mut cursor = self.loyalty_level_collection.find(None, find_many_options).await?;
        
        let mut new_level: Option<LoyaltyLevel> = None;

        while let Some(level) = cursor.try_next().await? {
            if customer_loyalty.current_points >= level.required_points {
                new_level = Some(level);
            } else {
                break;
            }
        }

        if let Some(ref level) = new_level {
            let level_id = level.id.unwrap();
            let current_level_id = customer_loyalty.current_level;

            let is_new_level = match current_level_id {
                Some(id) => id != level_id,
                None => true,
            };

            if is_new_level {
                if level.level_up_bonus_points > 0.0 {
                    customer_loyalty.current_points += level.level_up_bonus_points;
                    customer_loyalty.total_points_earned += level.level_up_bonus_points;
                }
                customer_loyalty.current_level = Some(level_id);
            }
        }

        Ok(new_level)
    }

    pub async fn redeem_loyalty_points(
        &self,
        customer_id: ObjectId,
        points_to_redeem: f64,
        outlet_id: ObjectId,
    ) -> AppResult<(f64, f64)> {
        if points_to_redeem <= 0.0 {
            return Ok((0.0, 0.0));
        }

       // Find active loyalty program
        let filter = doc! {
            "isActive": true,
            "$or": [
                { "outlet": outlet_id },
                { "outlet": { "$exists": false } }
            ]
        };

        let loyalty_program = match self.loyalty_program_collection.find_one(filter, None).await? {
            Some(program) => program,
            None => return Ok((0.0, 0.0)),
        };

        let customer_filter = doc! {
            "customer": customer_id,
            "loyaltyProgram": loyalty_program.id.unwrap()
        };

        let mut customer_loyalty = match self.customer_loyalty_collection.find_one(customer_filter, None).await? {
            Some(cl) => cl,
            None => return Ok((0.0, 0.0)),
        };

        if customer_loyalty.current_points < points_to_redeem {
             return Ok((0.0, 0.0));
        }

        let discount_amount = points_to_redeem * loyalty_program.discount_value_per_point;

        customer_loyalty.current_points -= points_to_redeem;
        customer_loyalty.total_points_redeemed += points_to_redeem;
        customer_loyalty.updated_at = Some(Utc::now());

        let update_filter = doc! { "_id": customer_loyalty.id.unwrap() };
        let update_doc = doc! {
            "$set": {
                "currentPoints": customer_loyalty.current_points,
                "totalPointsRedeemed": customer_loyalty.total_points_redeemed,
                "updatedAt": customer_loyalty.updated_at
            }
        };

        self.customer_loyalty_collection.update_one(update_filter, update_doc, None).await?;

        Ok((discount_amount, points_to_redeem))
    }
}
