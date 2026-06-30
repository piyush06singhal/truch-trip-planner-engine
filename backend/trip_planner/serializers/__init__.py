from rest_framework import serializers
from ..models import Trip, Stop, ELDLogDay, ELDEvent
from ..validators import validate_location_name, validate_hos_cycle_hours

# ==================================================
# 1. INPUT SERIALIZERS (Validation & Request Parsing)
# ==================================================

class TripInputSerializer(serializers.Serializer):
    """
    Input serializer validating request parameters for a trip planning query.
    """
    current_location = serializers.CharField(
        validators=[validate_location_name],
        error_messages={"required": "Current location is a required search query parameter."}
    )
    pickup_location = serializers.CharField(
        validators=[validate_location_name],
        error_messages={"required": "Pickup location is a required search query parameter."}
    )
    dropoff_location = serializers.CharField(
        validators=[validate_location_name],
        error_messages={"required": "Dropoff location is a required search query parameter."}
    )
    cycle_hours_used = serializers.FloatField(
        validators=[validate_hos_cycle_hours],
        error_messages={"required": "Starting cycle hours used is a required field."}
    )

    def validate(self, attrs):
        """
        Cross-field checks verifying origin and destination parameters do not overlap.
        """
        curr = attrs.get('current_location', '').strip().lower()
        pick = attrs.get('pickup_location', '').strip().lower()
        drop = attrs.get('dropoff_location', '').strip().lower()

        if curr and pick and curr == pick:
            raise serializers.ValidationError({
                "pickup_location": "Pickup location cannot be identical to the origin location."
            })
        if pick and drop and pick == drop:
            raise serializers.ValidationError({
                "dropoff_location": "Dropoff location cannot be identical to the pickup location."
            })
        return attrs


# ==================================================
# 2. OUTPUT SERIALIZERS (Nested Data Formatting)
# ==================================================

class ELDEventSerializer(serializers.ModelSerializer):
    """
    Serializer formatting individual sub-day compliance event logs.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ELDEvent
        fields = [
            "id", 
            "status", 
            "status_display", 
            "start_time", 
            "end_time", 
            "location_name", 
            "remarks"
        ]
        read_only_fields = fields


class ELDLogDaySerializer(serializers.ModelSerializer):
    """
    Serializer formatting full 24-hour compliance sheets including nested events.
    """
    events = ELDEventSerializer(many=True, read_only=True)

    class Meta:
        model = ELDLogDay
        fields = [
            "id", 
            "log_date", 
            "driving_hours", 
            "on_duty_hours", 
            "off_duty_hours", 
            "sleeper_berth_hours", 
            "events"
        ]
        read_only_fields = fields


class StopSerializer(serializers.ModelSerializer):
    """
    Serializer formatting trip plan routing coordinates and markers.
    """
    stop_type_display = serializers.CharField(source='get_stop_type_display', read_only=True)

    class Meta:
        model = Stop
        fields = [
            "id", 
            "stop_type", 
            "stop_type_display", 
            "location_name", 
            "latitude", 
            "longitude", 
            "arrival_time", 
            "duration_hours", 
            "distance_from_start_miles"
        ]
        read_only_fields = fields


class TripOutputSerializer(serializers.ModelSerializer):
    """
    Top-level nested response serializer representing the complete calculated route.
    """
    stops = StopSerializer(many=True, read_only=True)
    eld_sheets = ELDLogDaySerializer(many=True, read_only=True, source='eld_days')

    class Meta:
        model = Trip
        fields = [
            "id", 
            "current_location_name", 
            "current_location_lat", 
            "current_location_lng", 
            "pickup_location_name", 
            "pickup_location_lat", 
            "pickup_location_lng", 
            "dropoff_location_name", 
            "dropoff_location_lat", 
            "dropoff_location_lng", 
            "start_cycle_used_hours", 
            "total_distance_miles", 
            "total_duration_hours", 
            "stops", 
            "eld_sheets"
        ]
        read_only_fields = fields
