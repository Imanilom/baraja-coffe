use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::models::{Event, EventStatus, FreeRegistration};
use crate::db::DbConnection;
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct EventRepository {
    event_collection: Collection<Event>,
}

impl EventRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            event_collection: db.collection("events"),
        }
    }

    // CRUD Operations

    pub async fn create_event(&self, event: Event) -> AppResult<ObjectId> {
        let result = self.event_collection.insert_one(event, None).await?;
        Ok(result
            .inserted_id
            .as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted event ID".to_string()))?)
    }

    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<Event>> {
        Ok(self
            .event_collection
            .find_one(doc! { "_id": id }, None)
            .await?)
    }

    pub async fn find_all(&self, filter: Option<bson::Document>) -> AppResult<Vec<Event>> {
        let filter = filter.unwrap_or_else(|| doc! {});
        let mut cursor = self.event_collection.find(filter, None).await?;
        let mut events = Vec::new();

        while cursor.advance().await? {
            events.push(cursor.deserialize_current()?);
        }

        Ok(events)
    }

    pub async fn update_event(&self, id: &ObjectId, event: Event) -> AppResult<()> {
        let update_doc = bson::to_document(&event).map_err(|e| AppError::BsonSerialization(e))?;

        self.event_collection
            .update_one(doc! { "_id": id }, doc! { "$set": update_doc }, None)
            .await?;

        Ok(())
    }

    pub async fn delete_event(&self, id: &ObjectId) -> AppResult<()> {
        self.event_collection
            .delete_one(doc! { "_id": id }, None)
            .await?;
        Ok(())
    }

    // Filtering

    pub async fn find_by_status(&self, status: EventStatus) -> AppResult<Vec<Event>> {
        let status_str = serde_json::to_value(&status)
            .ok()
            .and_then(|v| v.as_str().map(String::from))
            .unwrap_or_default();

        let filter = doc! { "status": status_str };
        self.find_all(Some(filter)).await
    }

    pub async fn find_available_events(&self) -> AppResult<Vec<Event>> {
        let now = mongodb::bson::DateTime::now();
        let filter = doc! {
            "$or": [
                { "status": "upcoming" },
                { "status": "ongoing" }
            ],
            "date": { "$gte": now },
            "isActive": true
        };

        self.find_all(Some(filter)).await
    }

    pub async fn find_by_category(&self, category: &str) -> AppResult<Vec<Event>> {
        let filter = doc! { "category": category };
        self.find_all(Some(filter)).await
    }

    // Registration Management

    pub async fn add_free_registration(
        &self,
        event_id: &ObjectId,
        registration: FreeRegistration,
    ) -> AppResult<()> {
        self.event_collection
            .update_one(
                doc! { "_id": event_id },
                doc! {
                    "$push": { "freeRegistrations": bson::to_document(&registration)? }
                },
                None,
            )
            .await?;

        Ok(())
    }

    pub async fn update_check_in_status(
        &self,
        event_id: &ObjectId,
        booking_code: &str,
        check_in_by: &str,
    ) -> AppResult<()> {
        let now = mongodb::bson::DateTime::now();

        self.event_collection
            .update_one(
                doc! {
                    "_id": event_id,
                    "freeRegistrations.bookingCode": booking_code
                },
                doc! {
                    "$set": {
                        "freeRegistrations.$.checkInStatus": "checked-in",
                        "freeRegistrations.$.checkInTime": now,
                        "freeRegistrations.$.checkInBy": check_in_by
                    }
                },
                None,
            )
            .await?;

        Ok(())
    }

    // Ticket Management

    pub async fn reserve_tickets(&self, event_id: &ObjectId, quantity: i32) -> AppResult<()> {
        self.event_collection
            .update_one(
                doc! {
                    "_id": event_id,
                    "$expr": {
                        "$gte": [
                            { "$subtract": ["$capacity", "$soldTickets"] },
                            quantity
                        ]
                    }
                },
                doc! {
                    "$inc": { "soldTickets": quantity }
                },
                None,
            )
            .await?;

        Ok(())
    }

    pub async fn release_tickets(&self, event_id: &ObjectId, quantity: i32) -> AppResult<()> {
        self.event_collection
            .update_one(
                doc! { "_id": event_id },
                doc! {
                    "$inc": { "soldTickets": -quantity }
                },
                None,
            )
            .await?;

        Ok(())
    }

    pub async fn add_ticket_purchase(
        &self,
        event_id: &ObjectId,
        order_id: &ObjectId,
    ) -> AppResult<()> {
        self.event_collection
            .update_one(
                doc! { "_id": event_id },
                doc! {
                    "$push": { "ticketPurchases": order_id }
                },
                None,
            )
            .await?;

        Ok(())
    }

    // Status Updates

    pub async fn update_event_statuses(&self) -> AppResult<()> {
        let now = mongodb::bson::DateTime::now();

        // Update upcoming to ongoing
        self.event_collection
            .update_many(
                doc! {
                    "status": "upcoming",
                    "date": { "$lte": now }
                },
                doc! { "$set": { "status": "ongoing" } },
                None,
            )
            .await?;

        // Update ongoing to completed
        self.event_collection
            .update_many(
                doc! {
                    "status": "ongoing",
                    "endDate": { "$lt": now }
                },
                doc! { "$set": { "status": "completed" } },
                None,
            )
            .await?;

        Ok(())
    }
}
