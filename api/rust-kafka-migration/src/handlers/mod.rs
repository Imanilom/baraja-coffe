pub mod auth;
pub mod menu;
pub mod inventory;
pub mod outlet;
pub mod order;
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
pub use menu::*;
pub use inventory::*;
pub use outlet::*;
pub use order::*;
// pub use loyalty::*;
pub use tax::*;
// pub mod promo; // Already defined above
pub use voucher::*;
pub use product::*;
pub use supplier::*;
pub use marketlist::*;
pub use recipe::*;
pub use hr::*;
