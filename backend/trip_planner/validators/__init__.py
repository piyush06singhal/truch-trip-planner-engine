from django.core.exceptions import ValidationError

def validate_latitude(value: float) -> None:
    """
    Validate that a latitude value is within the geodetic bounds [-90, 90].
    """
    if value is None:
        raise ValidationError("Latitude cannot be empty.")
    if not isinstance(value, (int, float)):
        raise ValidationError("Latitude must be a numeric float value.")
    if value < -90.0 or value > 90.0:
        raise ValidationError(f"Latitude must be between -90.0 and 90.0. (Got: {value})")

def validate_longitude(value: float) -> None:
    """
    Validate that a longitude value is within the geodetic bounds [-180, 180].
    """
    if value is None:
        raise ValidationError("Longitude cannot be empty.")
    if not isinstance(value, (int, float)):
        raise ValidationError("Longitude must be a numeric float value.")
    if value < -180.0 or value > 180.0:
        raise ValidationError(f"Longitude must be between -180.0 and 180.0. (Got: {value})")

def validate_hos_cycle_hours(value: float) -> None:
    """
    Validate that the driver's starting cycle hours used matches standard rules limits [0, 70].
    """
    if value is None:
        raise ValidationError("HOS starting cycle used hours cannot be empty.")
    if not isinstance(value, (int, float)):
        raise ValidationError("Cycle hours must be a numeric value.")
    if value < 0.0 or value > 70.0:
        raise ValidationError(f"Starting cycle hours must be between 0.0 and 70.0. (Got: {value})")

def validate_location_name(value: str) -> None:
    """
    Validate that a search query location name is valid, non-empty, and descriptive.
    """
    if not value or not isinstance(value, str):
        raise ValidationError("Location name must be a non-empty string.")
    cleaned = value.strip()
    if len(cleaned) < 3:
        raise ValidationError("Location name query must contain at least 3 characters.")
