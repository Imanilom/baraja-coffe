pub mod user;
pub mod role;

pub use user::{User, UserResponse, AuthType, CashierType, OutletRef};
pub use role::{Role, Permission};
