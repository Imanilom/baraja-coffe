pub mod auth;
pub mod event;
pub mod inventory;
pub mod menu;
pub mod order;
pub mod outlet;
pub mod promo;
pub mod voucher;

pub mod category;
pub mod product;
pub mod supplier;
// pub mod loyalty;
pub mod tax;
// pub mod promo;
pub mod hr;
pub mod marketlist;
pub mod recipe;
pub mod report;
pub mod webhook;

pub use auth::*;
pub use inventory::*;
pub use menu::*;
pub use order::*;
pub use outlet::*;
// pub use loyalty::*;
pub use tax::*;
// pub mod promo; // Already defined above
pub use hr::*;
pub use marketlist::*;
pub use product::*;
pub use recipe::*;
pub use supplier::*;
pub use voucher::*;
