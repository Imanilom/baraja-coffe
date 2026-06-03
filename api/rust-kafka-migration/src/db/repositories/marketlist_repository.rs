use bson::{doc, oid::ObjectId, Document};
use mongodb::{Collection, options::FindOptions};
use std::sync::Arc;
use futures::stream::TryStreamExt;

use crate::db::DbConnection;
use crate::db::models::{MarketList, Request};
use crate::error::AppResult;

#[derive(Clone)]
pub struct MarketListRepository {
    market_list_collection: Collection<MarketList>,
    request_collection: Collection<Request>,
}

impl MarketListRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            market_list_collection: db.collection("marketlists"),
            request_collection: db.collection("requests"),
        }
    }

    // --- MarketList Methods ---

    pub async fn create_market_list(&self, market_list: MarketList) -> AppResult<ObjectId> {
        let result = self.market_list_collection.insert_one(market_list, None).await?;
        Ok(result.inserted_id.as_object_id().unwrap())
    }

    pub async fn find_market_list_by_id(&self, id: &ObjectId) -> AppResult<Option<MarketList>> {
        Ok(self.market_list_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn find_market_lists(&self, filter: Document, limit: i64, skip: u64) -> AppResult<Vec<MarketList>> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(skip)
            .sort(doc! { "date": -1 })
            .build();
            
        let mut cursor = self.market_list_collection.find(filter, find_options).await?;
        let mut results = Vec::new();
        while let Some(item) = cursor.try_next().await? {
            results.push(item);
        }
        Ok(results)
    }

    pub async fn count_market_lists(&self, filter: Document) -> AppResult<u64> {
        Ok(self.market_list_collection.count_documents(filter, None).await?)
    }

    // --- Request Methods ---

    pub async fn create_request(&self, request: Request) -> AppResult<ObjectId> {
        let result = self.request_collection.insert_one(request, None).await?;
        Ok(result.inserted_id.as_object_id().unwrap())
    }

    pub async fn find_request_by_id(&self, id: &ObjectId) -> AppResult<Option<Request>> {
        Ok(self.request_collection.find_one(doc! { "_id": id }, None).await?)
    }

    pub async fn update_request(&self, id: &ObjectId, update_doc: Document) -> AppResult<bool> {
        let result = self.request_collection.update_one(doc! { "_id": id }, update_doc, None).await?;
        Ok(result.matched_count > 0)
    }

    pub async fn find_requests(&self, filter: Document, limit: i64, skip: u64) -> AppResult<Vec<Request>> {
        let find_options = FindOptions::builder()
            .limit(limit)
            .skip(skip)
            .sort(doc! { "date": -1 })
            .build();
            
        let mut cursor = self.request_collection.find(filter, find_options).await?;
        let mut results = Vec::new();
        while let Some(item) = cursor.try_next().await? {
            results.push(item);
        }
        Ok(results)
    }

    pub async fn count_requests(&self, filter: Document) -> AppResult<u64> {
        Ok(self.request_collection.count_documents(filter, None).await?)
    }
}
