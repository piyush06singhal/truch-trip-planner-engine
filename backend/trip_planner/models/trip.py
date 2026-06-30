import uuid
from django.db import models
from django.core.exceptions import ValidationError

class Trip(models.Model):
    """
    Trip model capturing current location, pickup and dropoff points, 
    cumulative HOS hours used, and overall route stats.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Current Location
    current_location_name = models.CharField(
        max_length=255, 
        verbose_name="Current Location Name"
    )
    current_location_lat = models.FloatField(
        verbose_name="Current Location Latitude"
    )
    current_location_lng = models.FloatField(
        verbose_name="Current Location Longitude"
    )
    
    # Pickup Location
    pickup_location_name = models.CharField(
        max_length=255, 
        verbose_name="Pickup Location Name"
    )
    pickup_location_lat = models.FloatField(
        verbose_name="Pickup Location Latitude"
    )
    pickup_location_lng = models.FloatField(
        verbose_name="Pickup Location Longitude"
    )
    
    # Dropoff Location
    dropoff_location_name = models.CharField(
        max_length=255, 
        verbose_name="Dropoff Location Name"
    )
    dropoff_location_lat = models.FloatField(
        verbose_name="Dropoff Location Latitude"
    )
    dropoff_location_lng = models.FloatField(
        verbose_name="Dropoff Location Longitude"
    )
    
    # Hours of Service parameter
    start_cycle_used_hours = models.FloatField(
        default=0.0,
        verbose_name="Start Cycle Used Hours"
    )
    
    # Trip Aggregates (calculated)
    total_distance_miles = models.FloatField(
        default=0.0, 
        verbose_name="Total Distance (Miles)"
    )
    total_duration_hours = models.FloatField(
        default=0.0, 
        verbose_name="Total Duration (Hours)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        db_table = "trips"
        verbose_name = "Trip"
        verbose_name_plural = "Trips"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["current_location_name"]),
            models.Index(fields=["pickup_location_name"]),
            models.Index(fields=["dropoff_location_name"]),
        ]

    def clean(self):
        super().clean()
        
        # Latitude validations
        for lat_field, lat_val in [
            ('current_location_lat', self.current_location_lat),
            ('pickup_location_lat', self.pickup_location_lat),
            ('dropoff_location_lat', self.dropoff_location_lat)
        ]:
            if lat_val is not None and (lat_val < -90.0 or lat_val > 90.0):
                raise ValidationError({lat_field: "Latitude must be between -90 and 90."})

        # Longitude validations
        for lng_field, lng_val in [
            ('current_location_lng', self.current_location_lng),
            ('pickup_location_lng', self.pickup_location_lng),
            ('dropoff_location_lng', self.dropoff_location_lng)
        ]:
            if lng_val is not None and (lng_val < -180.0 or lng_val > 180.0):
                raise ValidationError({lng_field: "Longitude must be between -180 and 180."})

        # Cycle used validation
        if self.start_cycle_used_hours < 0.0 or self.start_cycle_used_hours > 70.0:
            raise ValidationError({
                "start_cycle_used_hours": "Start cycle hours must be between 0.0 and 70.0."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Trip {self.id} ({self.current_location_name} -> {self.dropoff_location_name})"
