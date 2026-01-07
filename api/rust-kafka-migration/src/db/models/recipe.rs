use bson::oid::ObjectId;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ingredient {
    #[serde(rename = "productId")]
    pub product_id: ObjectId,
    
    #[serde(rename = "productName", skip_serializing_if = "Option::is_none")]
    pub product_name: Option<String>,
    
    #[serde(rename = "productSku", skip_serializing_if = "Option::is_none")]
    pub product_sku: Option<String>,
    
    pub quantity: f64,
    pub unit: String,
    
    #[serde(rename = "isDefault", default)]
    pub is_default: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToppingOption {
    #[serde(rename = "toppingName")]
    pub topping_name: String,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub ingredients: Vec<Ingredient>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddonOption {
    #[serde(rename = "addonName")]
    pub addon_name: String,
    
    #[serde(rename = "optionLabel")]
    pub option_label: String,
    #[serde(default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub ingredients: Vec<Ingredient>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Recipe {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    
    #[serde(rename = "menuItemId")]
    pub menu_item_id: ObjectId,
    
    #[serde(rename = "baseIngredients", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub base_ingredients: Vec<Ingredient>,
    
    #[serde(rename = "toppingOptions", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub topping_options: Vec<ToppingOption>,
    
    #[serde(rename = "addonOptions", default, deserialize_with = "crate::utils::serde_utils::deserialize_vec_or_single")]
    pub addon_options: Vec<AddonOption>,
    
    #[serde(rename = "createdAt", default = "mongodb::bson::DateTime::now")]
    pub created_at: mongodb::bson::DateTime,
}
