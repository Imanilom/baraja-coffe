use chrono::{DateTime, Datelike, TimeZone, Utc};
use chrono_tz::Asia::Jakarta;

/// Get current time in WIB (Western Indonesian Time, UTC+7)
pub fn get_wib_now() -> DateTime<Utc> {
    Utc::now()
}

/// Convert UTC datetime to WIB
pub fn to_wib<Tz: TimeZone>(dt: DateTime<Tz>) -> DateTime<chrono_tz::Tz> {
    dt.with_timezone(&Jakarta)
}

/// Get start and end of day in WIB for a given date
pub fn get_today_wib_range() -> (DateTime<Utc>, DateTime<Utc>) {
    let now_wib = Utc::now().with_timezone(&Jakarta);
    let start_of_day = Jakarta
        .with_ymd_and_hms(now_wib.year(), now_wib.month(), now_wib.day(), 0, 0, 0)
        .unwrap();
    let end_of_day = Jakarta
        .with_ymd_and_hms(now_wib.year(), now_wib.month(), now_wib.day(), 23, 59, 59)
        .unwrap();

    (
        start_of_day.with_timezone(&Utc),
        end_of_day.with_timezone(&Utc),
    )
}

/// Get WIB date range for a specific date
pub fn get_wib_date_range(date: DateTime<Utc>) -> (DateTime<Utc>, DateTime<Utc>) {
    let date_wib = date.with_timezone(&Jakarta);
    let start_of_day = Jakarta
        .with_ymd_and_hms(date_wib.year(), date_wib.month(), date_wib.day(), 0, 0, 0)
        .unwrap();
    let end_of_day = Jakarta
        .with_ymd_and_hms(
            date_wib.year(),
            date_wib.month(),
            date_wib.day(),
            23,
            59,
            59,
        )
        .unwrap();

    (
        start_of_day.with_timezone(&Utc),
        end_of_day.with_timezone(&Utc),
    )
}

/// Format datetime to WIB string
pub fn format_wib<Tz: TimeZone>(dt: DateTime<Tz>) -> String {
    let wib_dt = dt.with_timezone(&Jakarta);
    wib_dt.format("%Y-%m-%d %H:%M:%S WIB").to_string()
}

/// Parse food serving time with timezone handling
pub fn parse_food_serving_time(
    date_string: &str,
    reservation_date: Option<DateTime<Utc>>,
    reservation_time: Option<&str>,
) -> Option<DateTime<Utc>> {
    // Try parsing ISO format first
    if let Ok(dt) = DateTime::parse_from_rfc3339(date_string) {
        return Some(dt.with_timezone(&Utc));
    }

    // Try parsing custom format "DD/MM/YYYY, HH.MM"
    if date_string.contains('/') && date_string.contains(',') {
        let parts: Vec<&str> = date_string.split(", ").collect();
        if parts.len() == 2 {
            let date_parts: Vec<&str> = parts[0].split('/').collect();
            let time_parts: Vec<&str> = parts[1].split('.').collect();

            if date_parts.len() == 3 && time_parts.len() == 2 {
                if let (Ok(day), Ok(month), Ok(year), Ok(hour), Ok(minute)) = (
                    date_parts[0].parse::<u32>(),
                    date_parts[1].parse::<u32>(),
                    date_parts[2].parse::<i32>(),
                    time_parts[0].parse::<u32>(),
                    time_parts[1].parse::<u32>(),
                ) {
                    if let Some(dt) = Jakarta
                        .with_ymd_and_hms(year, month, day, hour, minute, 0)
                        .single()
                    {
                        return Some(dt.with_timezone(&Utc));
                    }
                }
            }
        }
    }

    // Fallback: use reservation date + time
    if let (Some(res_date), Some(res_time)) = (reservation_date, reservation_time) {
        let time_parts: Vec<&str> = res_time.split(':').collect();
        if time_parts.len() == 2 {
            if let (Ok(hour), Ok(minute)) =
                (time_parts[0].parse::<u32>(), time_parts[1].parse::<u32>())
            {
                let res_date_wib = res_date.with_timezone(&Jakarta);
                if let Some(dt) = Jakarta
                    .with_ymd_and_hms(
                        res_date_wib.year(),
                        res_date_wib.month(),
                        res_date_wib.day(),
                        hour,
                        minute,
                        0,
                    )
                    .single()
                {
                    return Some(dt.with_timezone(&Utc));
                }
            }
        }
    }

    None
}
