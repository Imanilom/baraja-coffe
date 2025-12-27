use bson::{doc, oid::ObjectId};
use mongodb::Collection;
use std::sync::Arc;

use crate::db::DbConnection;
use crate::db::models::{User, Role};
use crate::error::{AppError, AppResult};

#[derive(Clone)]
pub struct UserRepository {
    collection: Collection<User>,
    role_collection: Collection<Role>,
}

impl UserRepository {
    pub fn new(db: Arc<DbConnection>) -> Self {
        Self {
            collection: db.collection("users"),
            role_collection: db.collection("roles"),
        }
    }

    /// Find user by ID
    pub async fn find_by_id(&self, id: &ObjectId) -> AppResult<Option<User>> {
        Ok(self.collection.find_one(doc! { "_id": id }, None).await?)
    }

    /// Find user by email
    pub async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        Ok(self.collection.find_one(doc! { "email": email }, None).await?)
    }

    /// Find user by username
    pub async fn find_by_username(&self, username: &str) -> AppResult<Option<User>> {
        Ok(self.collection.find_one(doc! { "username": username }, None).await?)
    }

    /// Find user by email or username (for login)
    pub async fn find_by_identifier(&self, identifier: &str) -> AppResult<Option<User>> {
        // Check if identifier is email (contains @)
        if identifier.contains('@') {
            self.find_by_email(identifier).await
        } else {
            self.find_by_username(identifier).await
        }
    }

    /// Create a new user
    pub async fn create(&self, user: User) -> AppResult<ObjectId> {
        let result = self.collection.insert_one(user, None).await?;
        
        Ok(result.inserted_id.as_object_id()
            .ok_or_else(|| AppError::Internal("Failed to get inserted user ID".to_string()))?)
    }

    /// Update user
    pub async fn update(&self, id: &ObjectId, user: User) -> AppResult<()> {
        let update_doc = bson::to_document(&user)
            .map_err(|e| AppError::BsonSerialization(e))?;

        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": update_doc },
            None,
        ).await?;

        Ok(())
    }

    /// Update user's auth type
    pub async fn update_auth_type(&self, id: &ObjectId, auth_type: &str) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "authType": auth_type } },
            None,
        ).await?;

        Ok(())
    }

    /// Update user password
    pub async fn update_password(&self, id: &ObjectId, hashed_password: &str) -> AppResult<()> {
        self.collection.update_one(
            doc! { "_id": id },
            doc! { "$set": { "password": hashed_password } },
            None,
        ).await?;

        Ok(())
    }

    /// Update user profile
    pub async fn update_profile(
        &self,
        id: &ObjectId,
        username: Option<&str>,
        phone: Option<&str>,
    ) -> AppResult<()> {
        let mut update_doc = bson::Document::new();
        
        if let Some(username) = username {
            update_doc.insert("username", username);
        }
        if let Some(phone) = phone {
            update_doc.insert("phone", phone);
        }

        if !update_doc.is_empty() {
            self.collection.update_one(
                doc! { "_id": id },
                doc! { "$set": update_doc },
                None,
            ).await?;
        }

        Ok(())
    }

    /// Get role by ID
    pub async fn get_role(&self, role_id: &ObjectId) -> AppResult<Option<Role>> {
        Ok(self.role_collection.find_one(doc! { "_id": role_id }, None).await?)
    }

    /// Get role by name
    pub async fn get_role_by_name(&self, name: &str) -> AppResult<Option<Role>> {
        Ok(self.role_collection.find_one(doc! { "name": name }, None).await?)
    }

    /// Get user with populated role
    pub async fn find_with_role(&self, id: &ObjectId) -> AppResult<Option<(User, Role)>> {
        if let Some(user) = self.find_by_id(id).await? {
            if let Some(role) = self.get_role(&user.role).await? {
                return Ok(Some((user, role)));
            }
        }
        Ok(None)
    }

    /// Get user by identifier with populated role
    pub async fn find_by_identifier_with_role(&self, identifier: &str) -> AppResult<Option<(User, Role)>> {
        if let Some(user) = self.find_by_identifier(identifier).await? {
            if let Some(role) = self.get_role(&user.role).await? {
                return Ok(Some((user, role)));
            }
        }
        Ok(None)
    }
}
