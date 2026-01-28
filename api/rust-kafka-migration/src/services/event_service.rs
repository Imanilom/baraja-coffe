use bson::oid::ObjectId;
use std::sync::Arc;

use crate::db::models::{Event, EventStatus, FreeRegistration, MenuItem};
use crate::db::repositories::{EventRepository, MenuRepository};
use crate::error::AppResult;

#[derive(Clone)]
pub struct EventService {
    event_repo: EventRepository,
    menu_repo: MenuRepository,
}

impl EventService {
    pub fn new(event_repo: EventRepository, menu_repo: MenuRepository) -> Self {
        Self {
            event_repo,
            menu_repo,
        }
    }

    // Create event with linked menu item
    pub async fn create_event_with_menu_item(
        &self,
        mut event: Event,
    ) -> AppResult<(Event, MenuItem)> {
        // Create menu item for the event
        let menu_item = MenuItem {
            id: None,
            name: event.name.clone(),
            price: event.price,
            description: Some(event.description.clone()),
            main_category: Some(crate::db::models::menu_item::MainCategory::Event),
            workstation: None,
            workstation_mapping: vec![],
            event: None, // Will be set after event creation
            is_event_item: true,
            event_type: Some(if event.is_free_event {
                crate::db::models::menu_item::EventType::Free
            } else {
                crate::db::models::menu_item::EventType::Paid
            }),
            toppings: vec![],
            addons: vec![],
            category: None,
            sub_category: None,
            image_url: Some(event.image_url.clone()),
            cost_price: 0.0,
            available_stock: event.capacity as f64,
            warehouse_stocks: vec![],
            available_at: vec![],
            is_active: event.status != EventStatus::Cancelled,
            sku: None,
            created_at: Some(mongodb::bson::DateTime::now()),
            updated_at: Some(mongodb::bson::DateTime::now()),
        };

        let menu_item_id = self.menu_repo.create_menu_item(menu_item.clone()).await?;

        // Link menu item to event
        event.menu_item = Some(menu_item_id);
        event.created_at = Some(mongodb::bson::DateTime::now());
        event.updated_at = Some(mongodb::bson::DateTime::now());

        let event_id = self.event_repo.create_event(event.clone()).await?;

        // Update menu item with event reference
        let mut updated_menu_item = menu_item;
        updated_menu_item.id = Some(menu_item_id);
        updated_menu_item.event = Some(event_id);
        self.menu_repo
            .update_menu_item(&menu_item_id, updated_menu_item.clone())
            .await?;

        // Return populated event
        let mut created_event = event;
        created_event.id = Some(event_id);

        Ok((created_event, updated_menu_item))
    }

    // Update event and linked menu item
    pub async fn update_event_and_menu_item(
        &self,
        id: &ObjectId,
        mut event: Event,
    ) -> AppResult<Event> {
        let existing_event = self
            .event_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

        event.updated_at = Some(mongodb::bson::DateTime::now());
        self.event_repo.update_event(id, event.clone()).await?;

        // Update linked menu item if exists
        if let Some(menu_item_id) = existing_event.menu_item {
            if let Some(mut menu_item) = self.menu_repo.find_menu_item_by_id(&menu_item_id).await? {
                menu_item.name = event.name.clone();
                menu_item.price = event.price;
                menu_item.description = Some(event.description.clone());
                menu_item.is_active = event.status != EventStatus::Cancelled;
                menu_item.available_stock = event.capacity as f64 - event.sold_tickets as f64;
                menu_item.updated_at = Some(mongodb::bson::DateTime::now());

                self.menu_repo
                    .update_menu_item(&menu_item_id, menu_item)
                    .await?;
            }
        }

        Ok(event)
    }

    // Delete event and cascade to menu item
    pub async fn delete_event_cascade(&self, id: &ObjectId) -> AppResult<()> {
        let event = self
            .event_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

        // Delete linked menu item if exists
        if let Some(menu_item_id) = event.menu_item {
            self.menu_repo.delete_menu_item(&menu_item_id).await?;
        }

        // Delete the event
        self.event_repo.delete_event(id).await?;

        Ok(())
    }

    // Get all events
    pub async fn get_all_events(&self, filter: Option<bson::Document>) -> AppResult<Vec<Event>> {
        self.event_repo.find_all(filter).await
    }

    // Get event by ID
    pub async fn get_event_by_id(&self, id: &ObjectId) -> AppResult<Option<Event>> {
        self.event_repo.find_by_id(id).await
    }

    // Get available events (upcoming or ongoing)
    pub async fn get_available_events(&self) -> AppResult<Vec<Event>> {
        self.event_repo.find_available_events().await
    }

    // Register for free event
    pub async fn register_free_event(
        &self,
        event_id: &ObjectId,
        full_name: String,
        email: String,
        phone: String,
        gender: Option<String>,
        current_city: Option<String>,
        notes: Option<String>,
    ) -> AppResult<(String, Event)> {
        let mut event = self
            .event_repo
            .find_by_id(event_id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

        if !event.is_free_event {
            return Err(crate::error::AppError::BadRequest(
                "This is not a free event. Please purchase tickets instead.".to_string(),
            ));
        }

        // Check capacity
        if event.is_at_capacity() {
            return Err(crate::error::AppError::BadRequest(
                "Event is at full capacity".to_string(),
            ));
        }

        // Check if email already registered
        if event.find_registration_by_email(&email).is_some() {
            return Err(crate::error::AppError::BadRequest(
                "Email already registered for this event".to_string(),
            ));
        }

        // Generate booking code
        let booking_code = event.generate_booking_code();

        let registration = FreeRegistration {
            booking_code: booking_code.clone(),
            full_name,
            email,
            phone,
            gender,
            current_city,
            registration_date: mongodb::bson::DateTime::now(),
            notes,
            check_in_status: crate::db::models::event::CheckInStatus::Pending,
            check_in_time: None,
            check_in_by: None,
        };

        self.event_repo
            .add_free_registration(event_id, registration)
            .await?;

        // Fetch updated event
        let updated_event = self
            .event_repo
            .find_by_id(event_id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

        Ok((booking_code, updated_event))
    }

    // Check-in attendee
    pub async fn check_in_attendee(
        &self,
        event_id: &ObjectId,
        booking_code: &str,
        check_in_by: &str,
    ) -> AppResult<Event> {
        let event = self
            .event_repo
            .find_by_id(event_id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))?;

        // Validate booking code exists
        let registration = event
            .find_registration_by_booking_code(booking_code)
            .ok_or_else(|| {
                crate::error::AppError::NotFound("Booking code not found".to_string())
            })?;

        // Check if already checked in
        if registration.check_in_status == crate::db::models::event::CheckInStatus::CheckedIn {
            return Err(crate::error::AppError::BadRequest(
                "Already checked in".to_string(),
            ));
        }

        self.event_repo
            .update_check_in_status(event_id, booking_code, check_in_by)
            .await?;

        // Return updated event
        self.event_repo
            .find_by_id(event_id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound("Event not found".to_string()))
    }

    // Update event statuses automatically
    pub async fn update_event_statuses(&self) -> AppResult<()> {
        self.event_repo.update_event_statuses().await
    }

    // Reserve tickets for paid event
    pub async fn reserve_tickets(&self, event_id: &ObjectId, quantity: i32) -> AppResult<()> {
        self.event_repo.reserve_tickets(event_id, quantity).await
    }

    // Release tickets (e.g., payment failed)
    pub async fn release_tickets(&self, event_id: &ObjectId, quantity: i32) -> AppResult<()> {
        self.event_repo.release_tickets(event_id, quantity).await
    }

    // Add ticket purchase record
    pub async fn add_ticket_purchase(
        &self,
        event_id: &ObjectId,
        order_id: &ObjectId,
    ) -> AppResult<()> {
        self.event_repo
            .add_ticket_purchase(event_id, order_id)
            .await
    }
}
