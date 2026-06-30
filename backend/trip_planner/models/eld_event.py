import uuid
from django.db import models
from django.core.exceptions import ValidationError
from .eld_log_day import ELDLogDay

class ELDEvent(models.Model):
    """
    Sub-day duty events tracking exact changes in status (Off Duty, Sleeper Berth, 
    Driving, On Duty Non-Driving) throughout a 24-hour log period.
    """
    STATUS_CHOICES = [
        ('OFF_DUTY', 'Off Duty'),
        ('SLEEPER', 'Sleeper Berth'),
        ('DRIVING', 'Driving'),
        ('ON_DUTY_ND', 'On Duty (Non-Driving)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    eld_log_day = models.ForeignKey(
        ELDLogDay, 
        on_delete=models.CASCADE, 
        related_name="events", 
        verbose_name="ELD Log Day"
    )
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        verbose_name="Duty Status"
    )
    start_time = models.DateTimeField(
        verbose_name="Start Time"
    )
    end_time = models.DateTimeField(
        verbose_name="End Time"
    )
    location_name = models.CharField(
        max_length=255, 
        verbose_name="Location Name"
    )
    remarks = models.CharField(
        max_length=255, 
        blank=True, 
        verbose_name="Remarks"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created At")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")

    class Meta:
        db_table = "eld_events"
        verbose_name = "ELD Event"
        verbose_name_plural = "ELD Events"
        ordering = ["start_time"]
        indexes = [
            models.Index(fields=["eld_log_day", "start_time"]),
            models.Index(fields=["status"]),
        ]

    def clean(self):
        super().clean()
        
        # Verify timeline chronology
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({
                "end_time": "Event end time must occur strictly after start time."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Event {self.id} - {self.get_status_display()} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"
