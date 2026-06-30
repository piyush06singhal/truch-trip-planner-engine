from django.contrib import admin
from .models import Trip, Stop, ELDLogDay, ELDEvent

class StopInline(admin.TabularInline):
    model = Stop
    extra = 0
    readonly_fields = ("created_at", "updated_at")
    ordering = ("arrival_time",)

class ELDLogDayInline(admin.TabularInline):
    model = ELDLogDay
    extra = 0
    readonly_fields = ("created_at", "updated_at")
    ordering = ("log_date",)

class ELDEventInline(admin.TabularInline):
    model = ELDEvent
    extra = 0
    readonly_fields = ("created_at", "updated_at")
    ordering = ("start_time",)

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = (
        "id", 
        "current_location_name", 
        "pickup_location_name", 
        "dropoff_location_name", 
        "total_distance_miles", 
        "created_at"
    )
    search_fields = (
        "id", 
        "current_location_name", 
        "pickup_location_name", 
        "dropoff_location_name"
    )
    list_filter = ("created_at",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [StopInline, ELDLogDayInline]
    list_per_page = 20
    ordering = ("-created_at",)

@admin.register(Stop)
class StopAdmin(admin.ModelAdmin):
    list_display = (
        "id", 
        "trip", 
        "stop_type", 
        "location_name", 
        "arrival_time", 
        "duration_hours"
    )
    search_fields = ("id", "location_name", "trip__id")
    list_filter = ("stop_type", "arrival_time")
    readonly_fields = ("id", "created_at", "updated_at")
    list_per_page = 50
    ordering = ("trip", "arrival_time")

@admin.register(ELDLogDay)
class ELDLogDayAdmin(admin.ModelAdmin):
    list_display = (
        "id", 
        "trip", 
        "log_date", 
        "driving_hours", 
        "on_duty_hours", 
        "off_duty_hours", 
        "sleeper_berth_hours"
    )
    search_fields = ("id", "trip__id")
    list_filter = ("log_date",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [ELDEventInline]
    list_per_page = 30
    ordering = ("trip", "log_date")

@admin.register(ELDEvent)
class ELDEventAdmin(admin.ModelAdmin):
    list_display = (
        "id", 
        "eld_log_day", 
        "status", 
        "start_time", 
        "end_time", 
        "location_name"
    )
    search_fields = ("id", "location_name", "eld_log_day__trip__id")
    list_filter = ("status", "start_time")
    readonly_fields = ("id", "created_at", "updated_at")
    list_per_page = 50
    ordering = ("eld_log_day", "start_time")
