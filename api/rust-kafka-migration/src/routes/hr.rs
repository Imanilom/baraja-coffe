use axum::{
    routing::{get, post, put, patch},
    Router, middleware,
};
use std::sync::Arc;

use crate::{
    handlers::hr,
    AppState,
    middleware::hr_middleware,
    middleware::auth_middleware,
};

pub fn hr_routes(state: Arc<AppState>) -> Router<Arc<AppState>> {
    // 1. Company Management Routes
    let company_routes = Router::new()
        .route("/", get(hr::company::get_all_companies).post(hr::company::create_company))
        .route("/:id", get(hr::company::get_company_by_id).put(hr::company::update_company))
        .route("/:id/activate", patch(hr::company::activate_company))
        .route("/:id/deactivate", patch(hr::company::deactivate_company))
        .route("/:id/settings", get(hr::company::get_company_settings).put(hr::company::update_company_settings))
        .route("/:id/reset-settings", post(hr::settings::reset_settings));

    // 2. Employee Routes (Multi-tenant context aware)
    let employee_routes = Router::new()
        .route("/", get(hr::employee::get_all_employees).post(hr::employee::create_employee))
        .route("/:id", get(hr::employee::get_employee_by_id).put(hr::employee::update_employee))
        .route("/:id/deactivate", patch(hr::employee::deactivate_employee))
        .route("/:id/salary-summary", get(hr::employee::get_salary_summary));

    // 3. Attendance Routes
    let attendance_routes = Router::new()
        .route("/checkin", post(hr::attendance::check_in))
        .route("/checkout", post(hr::attendance::check_out))
        .route("/employee/:employee_id", get(hr::attendance::get_attendance_by_employee));

    // 4. Salary Routes
    let salary_routes = Router::new()
        .route("/calculate", post(hr::salary::calculate_salary))
        .route("/:id/pay", patch(hr::salary::mark_as_paid));

    // 5. Fingerprint Routes
    let fingerprint_routes = Router::new()
        .route("/register", post(hr::fingerprint::register_fingerprint))
        .route("/sync", post(hr::fingerprint::sync_device));

    // 6. Settings/Utils Routes
    let settings_routes = Router::new()
        .route("/preview-bpjs", post(hr::settings::get_bpjs_preview));

    // Determine middleware stack
    // auth_middleware is required for most operations
    // set_company_context extracts header but is optional (some routes like create company don't need it)
    // verify_company_access enforces context

    // For now, we apply Auth to all HR routes.
    // Company Context is applied to specific sub-routers or generally but treated as optional in handlers if not enforced.

    Router::new()
        .nest("/companies", company_routes)
        .nest("/employees", employee_routes)
        .nest("/attendance", attendance_routes)
        .nest("/salaries", salary_routes)
        .nest("/fingerprints", fingerprint_routes)
        .nest("/settings", settings_routes)
        .layer(middleware::from_fn(hr_middleware::set_company_context))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware))
}
