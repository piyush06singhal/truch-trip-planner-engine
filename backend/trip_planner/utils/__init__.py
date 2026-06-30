from datetime import datetime, date

# ==================================================
# 1. HOURS OF SERVICE (HOS) & LOGISTICS CONSTANTS
# ==================================================
DRIVING_LIMIT_HOURS = 11.0
ON_DUTY_LIMIT_HOURS = 14.0
BREAK_THRESHOLD_DRIVING_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
OFF_DUTY_MINIMUM_RESTART_HOURS = 34.0
OFF_DUTY_MINIMUM_DAILY_REST_HOURS = 10.0
FUELING_SEGMENT_MILES = 1000.0
FUELING_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
AVERAGE_HIGHWAY_SPEED_MPH = 60.0

# ==================================================
# 2. CONVERSION & FORMATTING HELPERS
# ==================================================

def meters_to_miles(meters: float) -> float:
    """
    Convert meters to miles, rounded to 2 decimal places.
    """
    if meters is None:
        return 0.0
    return round(meters * 0.000621371, 2)

def seconds_to_hours(seconds: float) -> float:
    """
    Convert seconds to decimal hours, rounded to 2 decimal places.
    """
    if seconds is None:
        return 0.0
    return round(seconds / 3600.0, 2)

def format_duration_hm(decimal_hours: float) -> str:
    """
    Format decimal hours into a readable standard HM representation (e.g. 4.5 -> "04h 30m").
    """
    if decimal_hours is None or decimal_hours < 0:
        return "00h 00m"
    total_minutes = int(round(decimal_hours * 60.0))
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours:02d}h {minutes:02d}m"

def format_iso_timestamp(dt: datetime) -> str:
    """
    Format a datetime object into a clean standard ISO 8601 string.
    """
    if dt is None:
        return ""
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")

def parse_iso_timestamp(timestamp_str: str) -> datetime:
    """
    Parse a standard ISO 8601 timestamp string into a datetime object.
    """
    if not timestamp_str:
        raise ValueError("Timestamp string cannot be empty.")
    try:
        return datetime.strptime(timestamp_str, "%Y-%m-%dT%H:%M:%SZ")
    except ValueError:
        return datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
