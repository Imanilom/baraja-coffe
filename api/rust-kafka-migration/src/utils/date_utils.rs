use chrono::{DateTime, FixedOffset, TimeZone, Utc};
use chrono_tz::Asia::Jakarta;

/// Get current time in WIB (Western Indonesia Time / Asia/Jakarta)
pub fn get_wib_now() -> DateTime<FixedOffset> {
    let utc_now = Utc::now();
    Jakarta.from_utc_datetime(&utc_now.naive_utc()).fixed_offset()
}

/// Convert UTC DateTime to WIB
pub fn to_wib(utc_time: DateTime<Utc>) -> DateTime<FixedOffset> {
    Jakarta.from_utc_datetime(&utc_time.naive_utc()).fixed_offset()
}

/// Format DateTime to WIB string
pub fn format_wib(dt: DateTime<Utc>) -> String {
    let wib = to_wib(dt);
    wib.format("%Y-%m-%d %H:%M:%S").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wib_timezone() {
        let wib_time = get_wib_now();
        assert_eq!(wib_time.offset().local_minus_utc(), 7 * 3600); // WIB is UTC+7
    }
}
