import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Tuple
from ..utils import (
    DRIVING_LIMIT_HOURS,
    ON_DUTY_LIMIT_HOURS,
    BREAK_THRESHOLD_DRIVING_HOURS,
    BREAK_DURATION_HOURS,
    OFF_DUTY_MINIMUM_RESTART_HOURS,
    OFF_DUTY_MINIMUM_DAILY_REST_HOURS,
    FUELING_SEGMENT_MILES,
    FUELING_DURATION_HOURS,
    PICKUP_DURATION_HOURS,
    DROPOFF_DURATION_HOURS,
    AVERAGE_HIGHWAY_SPEED_MPH
)
from ..exceptions import ValidationError, TripPlanningError

class CycleCalculator:
    """
    Tracks and updates the driver's 70-hour / 8-day duty cycle balance.
    """
    def __init__(self, cycle_hours_used: float):
        if cycle_hours_used < 0.0 or cycle_hours_used > 70.0:
            raise ValidationError("Starting cycle hours must be between 0.0 and 70.0.")
        self.limit = 70.0
        self.used = cycle_hours_used

    @property
    def remaining(self) -> float:
        return max(0.0, self.limit - self.used)

    def consume(self, hours: float) -> None:
        self.used = min(self.limit, self.used + hours)

    def restart(self) -> None:
        self.used = 0.0


class DutyWindowCalculator:
    """
    Manages the 14-hour on-duty window countdown timer.
    """
    def __init__(self):
        self.limit = ON_DUTY_LIMIT_HOURS
        self.window_start: datetime | None = None

    def start_window(self, current_time: datetime) -> None:
        if self.window_start is None:
            self.window_start = current_time

    def get_remaining(self, current_time: datetime) -> float:
        if self.window_start is None:
            return self.limit
        elapsed = (current_time - self.window_start).total_seconds() / 3600.0
        return max(0.0, self.limit - elapsed)

    def reset(self) -> None:
        self.window_start = None


class FuelPlanner:
    """
    Manages the insertion of 30-minute fueling stops every 1000 miles.
    """
    def __init__(self):
        self.threshold = FUELING_SEGMENT_MILES
        self.miles_since_fuel = 0.0

    def add_miles(self, miles: float) -> None:
        self.miles_since_fuel += miles

    def get_miles_to_fuel(self) -> float:
        return max(0.0, self.threshold - self.miles_since_fuel)

    def reset_fuel_counter(self) -> None:
        self.miles_since_fuel = 0.0


class BreakPlanner:
    """
    Tracks driving times and forces a 30-minute off-duty break after 8 hours of cumulative driving.
    """
    def __init__(self):
        self.threshold = BREAK_THRESHOLD_DRIVING_HOURS
        self.driving_since_break = 0.0

    def add_driving(self, hours: float) -> None:
        self.driving_since_break += hours

    def get_hours_to_break(self) -> float:
        return max(0.0, self.threshold - self.driving_since_break)

    def reset_break_counter(self) -> None:
        self.driving_since_break = 0.0


class HOSCalculator:
    """
    Simulates the truck driving itinerary under FMCSA regulations.
    """
    def __init__(
        self, 
        current_location: str, 
        pickup_location: str, 
        dropoff_location: str, 
        start_cycle_used: float,
        start_time: datetime | None = None
    ):
        self.current_location = current_location
        self.pickup_location = pickup_location
        self.dropoff_location = dropoff_location
        
        self.cycle = CycleCalculator(start_cycle_used)
        self.duty_window = DutyWindowCalculator()
        self.fuel_planner = FuelPlanner()
        self.break_planner = BreakPlanner()
        
        if start_time is None:
            try:
                from django.utils import timezone
                start_time = timezone.localtime(timezone.now())
            except Exception:
                from datetime import datetime
                start_time = datetime.now()

        self.current_time = start_time
        self.driving_in_shift = 0.0
        self.timeline_events: List[Dict[str, Any]] = []

    def log_event(
        self, 
        event_type: str, 
        duration: float, 
        location: str, 
        status: str, 
        remarks: str
    ) -> None:
        """
        Record a timeline event, advancing the current clock.
        """
        start = self.current_time
        self.current_time += timedelta(hours=duration)
        self.timeline_events.append({
            "type": event_type,
            "start_time": start,
            "end_time": self.current_time,
            "duration": duration,
            "location": location,
            "status": status,
            "remarks": remarks
        })

    def handle_off_duty_rest(self, rest_duration: float, remark: str) -> None:
        """
        Handle off-duty rest breaks (30m, 10h sleep, or 34h restarts).
        """
        event_type = "BREAK"
        status = "OFF_DUTY"
        
        if rest_duration >= OFF_DUTY_MINIMUM_RESTART_HOURS:
            event_type = "RESTART"
            self.cycle.restart()
            self.duty_window.reset()
            self.driving_in_shift = 0.0
            self.break_planner.reset_break_counter()
        elif rest_duration >= OFF_DUTY_MINIMUM_DAILY_REST_HOURS:
            event_type = "SLEEP"
            status = "SLEEPER"
            self.duty_window.reset()
            self.driving_in_shift = 0.0
            self.break_planner.reset_break_counter()
        else:
            self.break_planner.reset_break_counter()

        self.log_event(event_type, rest_duration, self.current_location, status, remark)

    def handle_on_duty_non_driving(self, duration: float, event_type: str, remark: str) -> None:
        """
        Inserts On-Duty (Non-Driving) actions, inserting rest if window is exceeded.
        """
        # Ensure we have cycle hours to perform this activity
        if self.cycle.remaining < duration:
            self.handle_off_duty_rest(OFF_DUTY_MINIMUM_RESTART_HOURS, "34h restart - exhausted cycle")
            
        # Ensure we have duty window space
        self.duty_window.start_window(self.current_time)
        if self.duty_window.get_remaining(self.current_time) < duration:
            self.handle_off_duty_rest(OFF_DUTY_MINIMUM_DAILY_REST_HOURS, "10h sleeper rest - exhausted duty window")
            self.duty_window.start_window(self.current_time)

        self.cycle.consume(duration)
        self.log_event(event_type, duration, self.current_location, "ON_DUTY_ND", remark)

    def simulate_driving_leg(self, leg_distance: float, leg_duration: float, destination_name: str) -> None:
        """
        Simulates driving a leg step-by-step, inserting breaks as rules trigger.
        """
        if leg_distance < 0 or leg_duration < 0:
            raise ValidationError("Distance and duration parameters cannot be negative.")
        if leg_distance == 0.0:
            return

        speed = leg_distance / leg_duration if leg_duration > 0 else AVERAGE_HIGHWAY_SPEED_MPH
        remaining_duration = leg_duration

        while remaining_duration > 0.001:
            self.duty_window.start_window(self.current_time)
            
            # 1. Check constraints
            rem_cycle = self.cycle.remaining
            rem_window = self.duty_window.get_remaining(self.current_time)
            rem_shift_drive = max(0.0, DRIVING_LIMIT_HOURS - self.driving_in_shift)
            rem_break_drive = self.break_planner.get_hours_to_break()
            rem_fuel_drive = self.fuel_planner.get_miles_to_fuel() / speed

            # Find constraint limiting this step
            limits = [
                (remaining_duration, "LEG_END"),
                (rem_cycle, "CYCLE_RESTART"),
                (rem_window, "SLEEP_WINDOW"),
                (rem_shift_drive, "SLEEP_DRIVE"),
                (rem_break_drive, "BREAK_DRIVE"),
                (rem_fuel_drive, "FUEL_STOP")
            ]
            # Select constraint with the minimum duration
            t_drive, trigger = min(limits, key=lambda x: x[0])

            if t_drive > 0.001:
                # Execute drive segment
                self.driving_in_shift += t_drive
                self.break_planner.add_driving(t_drive)
                self.cycle.consume(t_drive)
                
                segment_miles = t_drive * speed
                self.fuel_planner.add_miles(segment_miles)
                
                self.log_event("DRIVING", t_drive, self.current_location, "DRIVING", f"Driving towards {destination_name}")
                remaining_duration -= t_drive

            # Handle trigger
            if trigger == "CYCLE_RESTART":
                self.handle_off_duty_rest(OFF_DUTY_MINIMUM_RESTART_HOURS, "34h restart - cycle limit reached")
            elif trigger in ("SLEEP_WINDOW", "SLEEP_DRIVE"):
                self.handle_off_duty_rest(OFF_DUTY_MINIMUM_DAILY_REST_HOURS, "10h sleep rest - shift limits reached")
            elif trigger == "BREAK_DRIVE":
                self.handle_off_duty_rest(BREAK_DURATION_HOURS, "Mandatory 30-minute off-duty break")
            elif trigger == "FUEL_STOP":
                self.handle_on_duty_non_driving(FUELING_DURATION_HOURS, "FUEL", "Fueling vehicle")
                self.fuel_planner.reset_fuel_counter()
            elif trigger == "LEG_END":
                break

        # Shift location to destination on completion
        self.current_location = destination_name


class DailyLogGenerator:
    """
    Splits calendar log events into standard 24-hour midnight-to-midnight sheets.
    """
    def generate(self, events: List[Dict[str, Any]], start_cycle_used: float) -> List[Dict[str, Any]]:
        if not events:
            return []

        days_map: Dict[date, Dict[str, Any]] = {}
        
        # Determine total date span
        start_date = events[0]["start_time"].date()
        end_date = events[-1]["end_time"].date()
        current_date = start_date

        while current_date <= end_date:
            days_map[current_date] = {
                "date": current_date.isoformat(),
                "summary": {"driving": 0.0, "on_duty_nd": 0.0, "off_duty": 0.0, "sleeper": 0.0},
                "events": [],
                "cycle_remaining": 70.0,
                "duty_window_used": 0.0,
                "driving_remaining": 11.0
            }
            current_date += timedelta(days=1)

        running_cycle_used = start_cycle_used

        for event in events:
            evt_start: datetime = event["start_time"]
            evt_end: datetime = event["end_time"]
            duration = event["duration"]
            status = event["status"]
            
            # Slices event across midnight boundaries
            temp_start = evt_start
            while temp_start < evt_end:
                day_boundary = datetime.combine(temp_start.date() + timedelta(days=1), datetime.min.time())
                if temp_start.tzinfo is not None:
                    day_boundary = day_boundary.replace(tzinfo=temp_start.tzinfo)
                seg_end = min(evt_end, day_boundary)
                seg_duration = (seg_end - temp_start).total_seconds() / 3600.0
                
                target_date = temp_start.date()
                day_log = days_map[target_date]
                
                # Increment status time
                if status == "DRIVING":
                    day_log["summary"]["driving"] += seg_duration
                    running_cycle_used += seg_duration
                elif status == "ON_DUTY_ND":
                    day_log["summary"]["on_duty_nd"] += seg_duration
                    running_cycle_used += seg_duration
                elif status == "OFF_DUTY":
                    day_log["summary"]["off_duty"] += seg_duration
                elif status == "SLEEPER":
                    day_log["summary"]["sleeper"] += seg_duration
                
                # Check status restarts
                if event["type"] == "RESTART":
                    running_cycle_used = 0.0

                # Log event mapping
                day_log["events"].append({
                    "status": status,
                    "start": temp_start.strftime("%H:%M"),
                    "end": seg_end.strftime("%H:%M"),
                    "remarks": event["remarks"]
                })
                
                # Set cycle tracking state
                day_log["cycle_remaining"] = max(0.0, 70.0 - running_cycle_used)
                
                temp_start = seg_end

        # Ensure all days sum to exactly 24.0 hours, adding missing gaps as OFF_DUTY
        for day_log in days_map.values():
            summary = day_log["summary"]
            total = summary["driving"] + summary["on_duty_nd"] + summary["off_duty"] + summary["sleeper"]
            if total < 24.0:
                summary["off_duty"] = round(summary["off_duty"] + (24.0 - total), 2)
                
            # Round summary hours for presentation consistency
            summary["driving"] = round(summary["driving"], 2)
            summary["on_duty_nd"] = round(summary["on_duty_nd"], 2)
            summary["off_duty"] = round(summary["off_duty"], 2)
            summary["sleeper"] = round(summary["sleeper"], 2)

        return list(days_map.values())


class TripPlanningEngine:
    """
    Top-level calculations orchestrator. Converts addresses into coordinates, queries routes,
    runs the HOS calculator simulation, and returns structured JSON output.
    """
    def plan_trip(
        self,
        current_location: str,
        pickup_location: str,
        dropoff_location: str,
        start_cycle_used: float,
        leg1_distance: float | None = None,
        leg1_duration: float | None = None,
        leg2_distance: float | None = None,
        leg2_duration: float | None = None,
        start_time: datetime | None = None
    ) -> Dict[str, Any]:
        
        # Validations
        if start_cycle_used < 0.0 or start_cycle_used > 70.0:
            raise ValidationError("Cycle hours used must be between 0.0 and 70.0.")
        if not current_location or not pickup_location or not dropoff_location:
            raise ValidationError("Origin, pickup, and destination location names are required.")

        # Geocode addresses to coordinates
        from .geocoding_service import GeocodingService
        from .routing_service import RoutingService
        import logging

        logger = logging.getLogger('trip_planner')
        geocoder = GeocodingService()
        router = RoutingService()

        try:
            lat1, lon1, norm_curr = geocoder.geocode_location(current_location)
        except Exception as e:
            logger.warning(f"Geocoding origin failed: {e}")
            raise ValidationError(f"Could not resolve origin location ''{current_location}''. Please provide a valid city or address.")

        try:
            lat2, lon2, norm_pick = geocoder.geocode_location(pickup_location)
        except Exception as e:
            logger.warning(f"Geocoding pickup failed: {e}")
            raise ValidationError(f"Could not resolve pickup location ''{pickup_location}''. Please provide a valid city or address.")

        try:
            lat3, lon3, norm_drop = geocoder.geocode_location(dropoff_location)
        except Exception as e:
            logger.warning(f"Geocoding destination failed: {e}")
            raise ValidationError(f"Could not resolve destination location ''{dropoff_location}''. Please provide a valid city or address.")

        # Query route information
        if leg1_distance is None or leg1_duration is None:
            route1 = router.get_route((lat1, lon1), (lat2, lon2))
            leg1_dist = route1["distance_miles"]
            leg1_dur = route1["duration_hours"]
            geom1 = route1["geometry"]
            bbox1 = route1["bounding_box"]
        else:
            leg1_dist = leg1_distance
            leg1_dur = leg1_duration
            geom1 = [(lat1, lon1), (lat2, lon2)]
            bbox1 = {"min_lat": min(lat1, lat2), "max_lat": max(lat1, lat2), "min_lng": min(lon1, lon2), "max_lng": max(lon1, lon2)}

        if leg2_distance is None or leg2_duration is None:
            route2 = router.get_route((lat2, lon2), (lat3, lon3))
            leg2_dist = route2["distance_miles"]
            leg2_dur = route2["duration_hours"]
            geom2 = route2["geometry"]
            bbox2 = route2["bounding_box"]
        else:
            leg2_dist = leg2_distance
            leg2_dur = leg2_duration
            geom2 = [(lat2, lon2), (lat3, lon3)]
            bbox2 = {"min_lat": min(lat2, lat3), "max_lat": max(lat2, lat3), "min_lng": min(lon2, lon3), "max_lng": max(lon2, lon3)}

        # Final parameters validations
        if leg1_dist < 0 or leg1_dur < 0 or leg2_dist < 0 or leg2_dur < 0:
            raise ValidationError("Distance and duration values cannot be negative.")

        # Initialize HOS Calculator
        calc = HOSCalculator(norm_curr, norm_pick, norm_drop, start_cycle_used, start_time)
        
        # 1. Trip Start
        calc.log_event("TRIP_START", 0.0, norm_curr, "OFF_DUTY", "Trip planning engine initiated")
        
        # 2. Drive to Pickup Leg
        calc.simulate_driving_leg(leg1_dist, leg1_dur, norm_pick)
        
        # 3. Arrive and perform Pickup
        calc.handle_on_duty_non_driving(PICKUP_DURATION_HOURS, "PICKUP", "Loading cargo at pickup location")
        
        # 4. Drive to Dropoff Leg
        calc.simulate_driving_leg(leg2_dist, leg2_dur, norm_drop)
        
        # 5. Arrive and perform Dropoff
        calc.handle_on_duty_non_driving(DROPOFF_DURATION_HOURS, "DROPOFF", "Unloading cargo at dropoff location")
        
        # 6. Trip Complete
        calc.log_event("TRIP_COMPLETE", 0.0, norm_drop, "OFF_DUTY", "Trip planning complete")

        # Compile daily logs
        daily_generator = DailyLogGenerator()
        daily_logs = daily_generator.generate(calc.timeline_events, start_cycle_used)

        # Count stop events
        rest_stops = sum(1 for e in calc.timeline_events if e["type"] == "BREAK")
        sleep_stops = sum(1 for e in calc.timeline_events if e["type"] == "SLEEP")
        fuel_stops = sum(1 for e in calc.timeline_events if e["type"] == "FUEL")
        restart_stops = sum(1 for e in calc.timeline_events if e["type"] == "RESTART")

        total_distance = round(leg1_dist + leg2_dist, 2)
        total_duration_hours = (calc.current_time - (start_time or datetime(2026, 6, 30, 8, 0, 0))).total_seconds() / 3600.0
        total_driving_hours = sum(e["duration"] for e in calc.timeline_events if e["status"] == "DRIVING")

        # Enclose the whole route bounding box
        bounding_box = {
            "min_lat": min(bbox1["min_lat"], bbox2["min_lat"]),
            "max_lat": max(bbox1["max_lat"], bbox2["max_lat"]),
            "min_lng": min(bbox1["min_lng"], bbox2["min_lng"]),
            "max_lng": max(bbox1["max_lng"], bbox2["max_lng"])
        }

        # Format final structured JSON
        return {
            "trip_summary": {
                "origin": norm_curr,
                "origin_lat": lat1,
                "origin_lng": lon1,
                "pickup": norm_pick,
                "pickup_lat": lat2,
                "pickup_lng": lon2,
                "destination": norm_drop,
                "destination_lat": lat3,
                "destination_lng": lon3,
                "total_distance_miles": total_distance,
                "total_duration_hours": round(total_duration_hours, 2),
                "total_driving_hours": round(total_driving_hours, 2)
            },
            "statistics": {
                "total_rest_stops": rest_stops,
                "total_sleep_stops": sleep_stops,
                "total_fuel_stops": fuel_stops,
                "total_restart_stops": restart_stops
            },
            "cycle_information": {
                "start_cycle_used_hours": start_cycle_used,
                "end_cycle_remaining_hours": round(calc.cycle.remaining, 2)
            },
            "timeline": [
                {
                    "type": e["type"],
                    "start_time": e["start_time"].isoformat(),
                    "end_time": e["end_time"].isoformat(),
                    "duration": round(e["duration"], 2),
                    "location": e["location"],
                    "status": e["status"],
                    "remarks": e["remarks"]
                }
                for e in calc.timeline_events
            ],
            "daily_logs": daily_logs,
            "route_geometry": geom1 + geom2,
            "bounding_box": bounding_box
        }
