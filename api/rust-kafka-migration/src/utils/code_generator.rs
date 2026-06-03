use bson::{doc, DateTime as BsonDateTime, Document};
use chrono::{Datelike, Duration, TimeZone, Utc};
use mongodb::{options::FindOneAndUpdateOptions, ClientSession, Collection};

use crate::error::AppError;

/// Get start of day (00:00:00) for a given DateTime
fn start_of_day(dt: chrono::DateTime<Utc>) -> chrono::DateTime<Utc> {
    Utc.with_ymd_and_hms(dt.year(), dt.month(), dt.day(), 0, 0, 0)
        .single()
        .unwrap_or(dt)
}

/// Get end of day (23:59:59) for a given DateTime
fn end_of_day(dt: chrono::DateTime<Utc>) -> chrono::DateTime<Utc> {
    Utc.with_ymd_and_hms(dt.year(), dt.month(), dt.day(), 23, 59, 59)
        .single()
        .unwrap_or(dt + Duration::days(1))
}

/// Generate unique reservation code in format: RSV-YYYYMMDD-XXX
pub async fn generate_reservation_code(
    reservation_collection: &Collection<Document>,
    session: &mut ClientSession,
) -> Result<String, AppError> {
    let now = Utc::now();
    let date_string = now.format("%Y%m%d").to_string();

    // Use atomic counter for sequence
    let start = start_of_day(now);
    let end = end_of_day(now);

    let filter = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_chrono(start),
            "$lt": BsonDateTime::from_chrono(end)
        }
    };

    let update = doc! {
        "$inc": { "_tempSequence": 1 }
    };

    let options = FindOneAndUpdateOptions::builder()
        .upsert(true)
        .return_document(mongodb::options::ReturnDocument::After)
        .build();

    match reservation_collection
        .find_one_and_update_with_session(filter, update, options, session)
        .await
    {
        Ok(Some(doc)) => {
            if let Ok(sequence) = doc.get_i32("_tempSequence") {
                Ok(format!("RSV-{}-{:03}", date_string, sequence))
            } else {
                // Fallback to timestamp-based
                let fallback = now.timestamp_millis() % 1000;
                Ok(format!("RSV-{}-{:03}", date_string, fallback))
            }
        }
        Ok(None) => {
            // Fallback
            Ok(format!("RSV-{}-001", date_string))
        }
        Err(_) => {
            // Fallback to timestamp-based
            let fallback = now.timestamp_millis() % 1000;
            Ok(format!("RSV-{}-{:03}", date_string, fallback))
        }
    }
}

/// Generate order sequence number for the day
pub async fn get_next_order_sequence(
    order_collection: &Collection<Document>,
    session: &mut ClientSession,
) -> Result<i32, AppError> {
    let now = Utc::now();
    let start = start_of_day(now);
    let end = end_of_day(now);

    let filter = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_chrono(start),
            "$lt": BsonDateTime::from_chrono(end)
        }
    };

    let update = doc! {
        "$inc": { "_tempSequence": 1 }
    };

    let options = FindOneAndUpdateOptions::builder()
        .upsert(true)
        .return_document(mongodb::options::ReturnDocument::After)
        .build();

    match order_collection
        .find_one_and_update_with_session(filter, update, options, session)
        .await
    {
        Ok(Some(doc)) => Ok(doc.get_i32("_tempSequence").unwrap_or(1)),
        Ok(None) => Ok(1),
        Err(_) => {
            // Fallback to random
            Ok((now.timestamp_millis() % 100) as i32 + 1)
        }
    }
}

/// Generate payment sequence number for the day
pub async fn get_next_payment_sequence(
    payment_collection: &Collection<Document>,
    session: &mut ClientSession,
) -> Result<i32, AppError> {
    let now = Utc::now();
    let start = start_of_day(now);
    let end = end_of_day(now);

    let filter = doc! {
        "createdAt": {
            "$gte": BsonDateTime::from_chrono(start),
            "$lt": BsonDateTime::from_chrono(end)
        }
    };

    let update = doc! {
        "$inc": { "_tempSequence": 1 }
    };

    let options = FindOneAndUpdateOptions::builder()
        .upsert(true)
        .return_document(mongodb::options::ReturnDocument::After)
        .build();

    match payment_collection
        .find_one_and_update_with_session(filter, update, options, session)
        .await
    {
        Ok(Some(doc)) => Ok(doc.get_i32("_tempSequence").unwrap_or(1)),
        Ok(None) => Ok(1),
        Err(_) => {
            // Fallback to random
            Ok((now.timestamp_millis() % 100) as i32 + 1)
        }
    }
}

/// Generate order ID in format: ORD-DDTableNumber-XXX or ORD-DDCODE-XXX
pub async fn generate_order_id(
    table_number: Option<&str>,
    counters_collection: &Collection<Document>,
) -> Result<String, AppError> {
    let now = Utc::now();
    let day = now.format("%d").to_string();

    let table_or_day_code = if let Some(table_num) = table_number {
        table_num.to_string()
    } else {
        // Use day code if no table number
        let days = ["MD", "TU", "WD", "TH", "FR", "ST", "SN"];
        let day_code = days[now.weekday().num_days_from_monday() as usize];
        format!("{}{}", day_code, day)
    };

    let date_str = now.format("%Y%m%d").to_string();
    let key = format!("order_seq_{}_{}", table_or_day_code, date_str);

    let filter = doc! { "_id": &key };
    let update = doc! { "$inc": { "seq": 1 } };
    let options = FindOneAndUpdateOptions::builder()
        .upsert(true)
        .return_document(mongodb::options::ReturnDocument::After)
        .build();

    match counters_collection
        .find_one_and_update(filter, update, options)
        .await
    {
        Ok(Some(doc)) => {
            let seq = doc.get_i32("seq").unwrap_or(1);
            Ok(format!("ORD-{}{}-{:03}", day, table_or_day_code, seq))
        }
        Ok(None) => Ok(format!("ORD-{}{}-001", day, table_or_day_code)),
        Err(e) => Err(AppError::Internal(e.to_string())),
    }
}
