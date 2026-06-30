import uuid
from django.db import models
from django.core.exceptions import ValidationError
from .trip import Trip

class ELDLogDay(models.Model):
    """
    Electronic Logging Device (ELD) daily log summaries, managing 24-hour 
    midnight-to-midnight hour distributions for a specific date.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(
        Trip, 
        on_delete=models.CASCADE, 
        related_name="eld_days", 
        verbose_name="Trip"
    )
    log_date = models.DateField(
        verbose_name="Log Date"
    )
    
    # 24-Hour Hour allocations
    driving_hours = models.FloatField(
        default=0.0, 
        verbose_name="Driving Hours"
    )
    on_duty_hours = models.FloatField(
        default=0.0, 
        verbose_name="On Duty (Non-Driving) Hours"
    )
    off_duty_hours = models.FloatField(
        default=0.0, 
        verbose_name="Off Duty Hours"
    )
    sleeper_berth_hours = models.FloatField(
        default=0.0, 
        verbose_name="Sleeper Berth Hours"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        db_table = "eld_log_days"
        verbose_name = "ELD Log Day"
        verbose_name_plural = "ELD Log Days"
        ordering = ["log_date"]
        indexes = [
            models.Index(fields=["trip", "log_date"]),
        ]
        unique_together = (("trip", "log_date"),)

    def clean(self):
        super().clean()
        
        # Verify hours are non-negative
        for field, val in [
            ('driving_hours', self.driving_hours),
            ('on_duty_hours', self.on_duty_hours),
            ('off_duty_hours', self.off_duty_hours),
            ('sleeper_berth_hours', self.sleeper_berth_hours)
        ]:
            if val is not None and val < 0.0:
                raise ValidationError({field: "Hours allocation cannot be negative."})

        # Sum validation for full 24-hour compliance day
        total_hours = (
            (self.driving_hours or 0.0) + 
            (self.on_duty_hours or 0.0) + 
            (self.off_duty_hours or 0.0) + 
            (self.sleeper_berth_hours or 0.0)
        )
        # Check within floating tolerance (24 hours)
        if abs(total_hours - 24.0) > 0.02:
            raise ValidationError(
                f"Total ELD daily log allocations must sum to exactly 24 hours. (Got: {total_hours:.2f} hours)"
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"ELD Log Day {self.log_date} (Trip: {self.trip_id})"
