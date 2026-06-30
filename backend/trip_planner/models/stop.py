import uuid
from django.db import models
from django.core.exceptions import ValidationError
from .trip import Trip

class Stop(models.Model):
    """
    Stops planned along a trip route, tracking coordinates, stop types, 
    arrival timelines, durations, and cumulative distances.
    """
    STOP_TYPES = [
        ('ORIGIN', 'Origin'),
        ('PICKUP', 'Pickup'),
        ('DROPOFF', 'Dropoff'),
        ('REST_STOP', 'Rest Stop'),
        ('FUEL_STOP', 'Fuel Stop'),
        ('SLEEP_STOP', 'Sleep Stop'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        Trip, 
        on_delete=models.CASCADE, 
        related_name="stops", 
        verbose_name="Trip"
    )
    
    stop_type = models.CharField(
        max_length=20, 
        choices=STOP_TYPES, 
        verbose_name="Stop Type"
    )
    location_name = models.CharField(
        max_length=255, 
        verbose_name="Location Name"
    )
    latitude = models.FloatField(
        verbose_name="Latitude"
    )
    longitude = models.FloatField(
        verbose_name="Longitude"
    )
    arrival_time = models.DateTimeField(
        verbose_name="Arrival Time"
    )
    duration_hours = models.FloatField(
        verbose_name="Duration (Hours)"
    )
    distance_from_start_miles = models.FloatField(
        default=0.0, 
        verbose_name="Distance From Start (Miles)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        db_table = "stops"
        verbose_name = "Stop"
        verbose_name_plural = "Stops"
        ordering = ["arrival_time"]
        indexes = [
            models.Index(fields=["trip", "arrival_time"]),
            models.Index(fields=["stop_type"]),
        ]

    def clean(self):
        super().clean()
        
        # Coordinates validation
        if self.latitude is not None and (self.latitude < -90.0 or self.latitude > 90.0):
            raise ValidationError({"latitude": "Latitude must be between -90 and 90."})
            
        if self.longitude is not None and (self.longitude < -180.0 or self.longitude > 180.0):
            raise ValidationError({"longitude": "Longitude must be between -180 and 180."})

        # Non-negative durations/distances validation
        if self.duration_hours is not None and self.duration_hours < 0.0:
            raise ValidationError({"duration_hours": "Duration hours cannot be negative."})
            
        if self.distance_from_start_miles is not None and self.distance_from_start_miles < 0.0:
            raise ValidationError({
                "distance_from_start_miles": "Distance from start cannot be negative."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stop {self.id} - {self.get_stop_type_display()} ({self.location_name})"
