use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Permission types for role-based access control
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    ManageUsers,
    ManageRoles,
    ManageProducts,
    ViewReports,
    ManageOutlets,
    ManageInventory,
    ManageVouchers,
    ManagePromo,
    ManageOrders,
    ManageShifts,
    ManageOperational,
    ManageLoyalty,
    ManageFinance,
    ManageReservations,
    ManageVendors,
    ManageExpenses,
    ManageEvents,
    ViewAuditLogs,
    Superadmin,
}

/// Role model matching Node.js Role schema
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    pub name: String,
    
    #[serde(default)]
    pub description: String,
    
    #[serde(default)]
    pub permissions: Vec<Permission>,
    
    #[serde(rename = "createdAt", skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
    
    #[serde(rename = "updatedAt", skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

impl Role {
    pub fn new(name: String, description: String, permissions: Vec<Permission>) -> Self {
        Self {
            id: None,
            name,
            description,
            permissions,
            created_at: None,
            updated_at: None,
        }
    }

    pub fn has_permission(&self, permission: &Permission) -> bool {
        self.permissions.contains(permission) || self.permissions.contains(&Permission::Superadmin)
    }
}
