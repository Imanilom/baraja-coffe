use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Authentication type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AuthType {
    Local,
    Google,
}

impl Default for AuthType {
    fn default() -> Self {
        Self::Local
    }
}

/// Cashier type enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum CashierType {
    Bar1Amphi,
    Bar2Amphi,
    Bar3Amphi,
    BarTp,
    BarDp,
    DriveThru,
}

/// Outlet reference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutletRef {
    #[serde(rename = "outletId")]
    pub outlet_id: ObjectId,
}

/// User model matching Node.js User schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub username: String,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    
    /// Hashed password - never send to client
    #[serde(skip_serializing)]
    pub password: String,
    
    #[serde(default)]
    pub address: Vec<String>,
    
    #[serde(rename = "profilePicture")]
    pub profile_picture: String,
    
    /// Role reference (ObjectId)
    pub role: ObjectId,
    
    #[serde(rename = "cashierType", skip_serializing_if = "Option::is_none")]
    pub cashier_type: Option<CashierType>,
    
    #[serde(default)]
    pub outlet: Vec<OutletRef>,
    
    #[serde(rename = "claimedVouchers", default)]
    pub claimed_vouchers: Vec<ObjectId>,
    
    #[serde(rename = "loyaltyPoints", default)]
    pub loyalty_points: i32,
    
    #[serde(rename = "loyaltyLevel", skip_serializing_if = "Option::is_none")]
    pub loyalty_level: Option<ObjectId>,
    
    #[serde(default)]
    pub favorites: Vec<ObjectId>,
    
    #[serde(rename = "authType", default)]
    pub auth_type: AuthType,
    
    #[serde(rename = "isActive", default = "default_true")]
    pub is_active: bool,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_true() -> bool {
    true
}

impl User {
    pub fn new(
        username: String,
        email: Option<String>,
        password: String,
        role: ObjectId,
        auth_type: AuthType,
    ) -> Self {
        Self {
            id: None,
            username,
            email,
            phone: None,
            password,
            address: Vec::new(),
            profile_picture: "https://img.freepik.com/premium-vector/man-avatar-profile-picture-vector-illustration_268834-538.jpg".to_string(),
            role,
            cashier_type: None,
            outlet: Vec::new(),
            claimed_vouchers: Vec::new(),
            loyalty_points: 0,
            loyalty_level: None,
            favorites: Vec::new(),
            auth_type,
            is_active: true,
            created_at: None,
            updated_at: None,
        }
    }
}

/// User response (without password) for API responses
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserResponse {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub username: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(default)]
    pub address: Vec<String>,
    #[serde(rename = "profilePicture")]
    pub profile_picture: String,
    pub role: String, // Role name, not ObjectId
    #[serde(rename = "cashierType", skip_serializing_if = "Option::is_none")]
    pub cashier_type: Option<CashierType>,
    #[serde(rename = "loyaltyPoints")]
    pub loyalty_points: i32,
    #[serde(rename = "authType")]
    pub auth_type: AuthType,
    #[serde(rename = "isActive")]
    pub is_active: bool,
}

impl From<(User, String)> for UserResponse {
    fn from((user, role_name): (User, String)) -> Self {
        Self {
            id: user.id.unwrap_or_else(ObjectId::new),
            username: user.username,
            email: user.email,
            phone: user.phone,
            address: user.address,
            profile_picture: user.profile_picture,
            role: role_name,
            cashier_type: user.cashier_type,
            loyalty_points: user.loyalty_points,
            auth_type: user.auth_type,
            is_active: user.is_active,
        }
    }
}
