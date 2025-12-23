use std::sync::Arc;
use mongodb::bson::{doc, oid::ObjectId};
use chrono::{Utc, Duration};
use tokio::time;

use crate::AppState;
use crate::error::{AppResult, AppError};
use crate::db::models::workstation::{PrintQueue, PrintQueueStatus};

pub struct PrintQueueService {
    state: Arc<AppState>,
}

impl PrintQueueService {
    pub fn new(state: Arc<AppState>) -> Self {
        Self { state }
    }

    /// Add print job to queue
    pub async fn enqueue_print(
        &self,
        order_id: String,
        outlet_id: ObjectId,
        printer_id: ObjectId,
        workstation: String,
        print_data: serde_json::Value,
    ) -> AppResult<ObjectId> {
        let queue_collection: mongodb::Collection<PrintQueue> = 
            self.state.db.collection("printqueue");
        
        let print_job = PrintQueue {
            id: None,
            order_id,
            outlet: outlet_id,
            printer_id,
            workstation,
            print_data,
            status: PrintQueueStatus::Pending,
            attempt_count: 0,
            max_retries: 3,
            last_error: None,
            scheduled_for: Some(Utc::now()),
            created_at: Utc::now(),
            completed_at: None,
        };

        let result = queue_collection.insert_one(&print_job, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(result.inserted_id.as_object_id().unwrap())
    }

    /// Process pending print jobs
    pub async fn process_queue(&self) -> AppResult<()> {
        let queue_collection: mongodb::Collection<PrintQueue> = 
            self.state.db.collection("printqueue");
        
        let mut cursor = queue_collection
            .find(doc! {
                "status": { "$in": ["pending", "retrying"] },
                "scheduledFor": { "$lte": Utc::now() }
            }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        while cursor.advance().await.map_err(|e| AppError::Database(e.to_string()))? {
            let job = cursor.deserialize_current()
                .map_err(|e| AppError::Database(e.to_string()))?;
            
            self.process_print_job(job).await?;
        }

        Ok(())
    }

    /// Process single print job
    async fn process_print_job(&self, mut job: PrintQueue) -> AppResult<()> {
        let job_id = job.id.unwrap();
        let queue_collection: mongodb::Collection<PrintQueue> = 
            self.state.db.collection("printqueue");
        
        // Update status to processing
        queue_collection
            .update_one(
                doc! { "_id": job_id },
                doc! { "$set": { "status": "processing" } },
                None,
            )
            .await
            .map_err(|e| AppError::Database(e.to_string()))?;

        // Attempt to print
        match self.send_to_printer(&job).await {
            Ok(_) => {
                // Success
                queue_collection
                    .update_one(
                        doc! { "_id": job_id },
                        doc! { "$set": {
                            "status": "completed",
                            "completedAt": Utc::now()
                        }},
                        None,
                    )
                    .await
                    .map_err(|e| AppError::Database(e.to_string()))?;

                tracing::info!("✅ Print job {} completed successfully", job_id);
            }
            Err(e) => {
                // Failure
                job.attempt_count += 1;
                
                if job.attempt_count >= job.max_retries {
                    // Max retries reached
                    queue_collection
                        .update_one(
                            doc! { "_id": job_id },
                            doc! { "$set": {
                                "status": "failed",
                                "lastError": e.to_string(),
                                "attemptCount": job.attempt_count
                            }},
                            None,
                        )
                        .await
                        .map_err(|e| AppError::Database(e.to_string()))?;

                    tracing::error!("❌ Print job {} failed after {} attempts", job_id, job.attempt_count);
                } else {
                    // Schedule retry with exponential backoff
                    let retry_delay = 2_i64.pow(job.attempt_count as u32) * 60; // 2, 4, 8 minutes
                    let next_attempt = Utc::now() + Duration::seconds(retry_delay);

                    queue_collection
                        .update_one(
                            doc! { "_id": job_id },
                            doc! { "$set": {
                                "status": "retrying",
                                "lastError": e.to_string(),
                                "attemptCount": job.attempt_count,
                                "scheduledFor": next_attempt
                            }},
                            None,
                        )
                        .await
                        .map_err(|e| AppError::Database(e.to_string()))?;

                    tracing::warn!("⚠️ Print job {} failed, retrying in {} minutes", job_id, retry_delay / 60);
                }
            }
        }

        Ok(())
    }

    /// Send print data to printer
    async fn send_to_printer(&self, job: &PrintQueue) -> AppResult<()> {
        // Get printer config
        let printer_collection: mongodb::Collection<mongodb::bson::Document> = 
            self.state.db.collection("printers");
        
        let printer = printer_collection
            .find_one(doc! { "_id": job.printer_id }, None)
            .await
            .map_err(|e| AppError::Database(e.to_string()))?
            .ok_or_else(|| AppError::NotFound("Printer not found".to_string()))?;

        // TODO: Implement actual ESC/POS printing
        // For now, simulate printing
        let ip_address = printer.get_str("ipAddress")
            .map_err(|_| AppError::BadRequest("Printer has no IP address".to_string()))?;

        tracing::info!("📄 Sending print job to printer at {}", ip_address);

        // Simulate network call
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

        // TODO: Replace with actual ESC/POS printing
        // Example: send_escpos_data(ip_address, &job.print_data).await?;

        Ok(())
    }

    /// Start background queue processor
    pub fn start_queue_processor(state: Arc<AppState>) {
        let service = Self::new(state);
        
        tokio::spawn(async move {
            let mut interval = time::interval(time::Duration::from_secs(30));
            
            loop {
                interval.tick().await;
                
                if let Err(e) = service.process_queue().await {
                    tracing::error!("Print queue processing error: {}", e);
                }
            }
        });
    }

    /// Get queue statistics
    pub async fn get_queue_stats(&self, outlet_id: ObjectId) -> AppResult<serde_json::Value> {
        let queue_collection: mongodb::Collection<PrintQueue> = 
            self.state.db.collection("printqueue");
        
        let total = queue_collection.count_documents(doc! { "outlet": outlet_id }, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let pending = queue_collection.count_documents(doc! { "outlet": outlet_id, "status": "pending" }, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let processing = queue_collection.count_documents(doc! { "outlet": outlet_id, "status": "processing" }, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let completed = queue_collection.count_documents(doc! { "outlet": outlet_id, "status": "completed" }, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;
        
        let failed = queue_collection.count_documents(doc! { "outlet": outlet_id, "status": "failed" }, None).await
            .map_err(|e| AppError::Database(e.to_string()))?;

        Ok(serde_json::json!({
            "total": total,
            "pending": pending,
            "processing": processing,
            "completed": completed,
            "failed": failed
        }))
    }
}
