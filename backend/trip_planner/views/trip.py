# pyrefly: ignore [missing-import]
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from datetime import datetime, date
from ..serializers import TripInputSerializer, TripOutputSerializer
from ..services.hos_calculator import TripPlanningEngine
from ..models import Trip, Stop, ELDLogDay, ELDEvent

from django.utils import timezone

def parse_iso(dt_str):
    # Parse ISO timezone formats safely (supporting 'Z' replacing)
    dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
    if timezone.is_naive(dt):
        return timezone.make_aware(dt)
    return dt

class TripViewSet(APIView):
    """
    Trip resource views processing geocoded planning execution requests and 
    saving results to DB.
    """
    def get(self, request):
        # Retrieve planned trips history list ordered by creation time for current user
        if request.user.is_authenticated:
            trips = Trip.objects.filter(user=request.user).order_by('-created_at')
        else:
            trips = Trip.objects.filter(user=None).order_by('-created_at')
        serializer = TripOutputSerializer(trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        curr = data["current_location"]
        pick = data["pickup_location"]
        drop = data["dropoff_location"]
        cycle = data["cycle_hours_used"]
        
        # Execute routing and hours-of-service compliance engines
        from ..exceptions import ValidationError as TripValidationError, RoutingError
        try:
            engine = TripPlanningEngine()
            plan = engine.plan_trip(curr, pick, drop, cycle)
        except TripValidationError as e:
            # User-facing input errors (invalid location names, empty fields) → 400
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except RoutingError as e:
            # Geocoding/routing failed (Nominatim returned no results) → 400
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to calculate compliant route: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
            
        summary = plan["trip_summary"]
        cycle_info = plan["cycle_information"]
        
        # Persist calculations within a single atomic transaction boundary
        with transaction.atomic():
            trip = Trip.objects.create(
                user=request.user if request.user.is_authenticated else None,
                current_location_name=summary["origin"],
                current_location_lat=summary["origin_lat"],
                current_location_lng=summary["origin_lng"],
                pickup_location_name=summary["pickup"],
                pickup_location_lat=summary["pickup_lat"],
                pickup_location_lng=summary["pickup_lng"],
                dropoff_location_name=summary["destination"],
                dropoff_location_lat=summary["destination_lat"],
                dropoff_location_lng=summary["destination_lng"],
                start_cycle_used_hours=cycle_info["start_cycle_used_hours"],
                total_distance_miles=summary["total_distance_miles"],
                total_duration_hours=summary["total_duration_hours"]
            )
            
            # Map key milestones as Stops
            stops_to_create = []
            stops_to_create.append(Stop(
                trip=trip,
                stop_type="ORIGIN",
                location_name=summary["origin"],
                latitude=summary["origin_lat"],
                longitude=summary["origin_lng"],
                arrival_time=parse_iso(plan["timeline"][0]["start_time"]),
                duration_hours=0.0,
                distance_from_start_miles=0.0
            ))
            
            cum_miles = 0.0
            speed = summary["total_distance_miles"] / summary["total_duration_hours"] if summary["total_duration_hours"] > 0 else 50.0
            
            for item in plan["timeline"]:
                t_type = item["type"]
                if t_type == "DRIVING":
                    cum_miles += item["duration"] * speed
                    continue
                
                stop_mapping = {
                    "BREAK": "REST_STOP",
                    "SLEEP": "SLEEP_STOP",
                    "FUEL": "FUEL_STOP",
                    "PICKUP": "PICKUP",
                    "DROPOFF": "DROPOFF"
                }
                
                if t_type in stop_mapping:
                    # Default coordinates mapping
                    lat, lng = summary["pickup_lat"], summary["pickup_lng"]
                    if t_type == "DROPOFF":
                        lat, lng = summary["destination_lat"], summary["destination_lng"]
                    elif t_type in ("BREAK", "SLEEP", "FUEL"):
                        # Default midpoint representation
                        lat = (summary["origin_lat"] + summary["pickup_lat"]) / 2.0
                        lng = (summary["origin_lng"] + summary["pickup_lng"]) / 2.0
                    
                    stops_to_create.append(Stop(
                        trip=trip,
                        stop_type=stop_mapping[t_type],
                        location_name=item["location"],
                        latitude=lat,
                        longitude=lng,
                        arrival_time=parse_iso(item["start_time"]),
                        duration_hours=item["duration"],
                        distance_from_start_miles=round(cum_miles, 2)
                    ))
            
            if stops_to_create:
                Stop.objects.bulk_create(stops_to_create)
            
            # Record Daily ELD log sheets
            events_to_create = []
            for sheet in plan["daily_logs"]:
                log_day = ELDLogDay.objects.create(
                    trip=trip,
                    log_date=date.fromisoformat(sheet["date"]),
                    driving_hours=sheet["summary"]["driving"],
                    on_duty_hours=sheet["summary"]["on_duty_nd"],
                    off_duty_hours=sheet["summary"]["off_duty"],
                    sleeper_berth_hours=sheet["summary"]["sleeper"]
                )
                
                # Link timeline compliance sub-events
                for event in plan["timeline"]:
                    evt_time = parse_iso(event["start_time"])
                    evt_end = parse_iso(event["end_time"])
                    # Skip zero-duration marker events like TRIP_START / TRIP_COMPLETE
                    if evt_time >= evt_end:
                        continue
                    if evt_time.strftime("%Y-%m-%d") == sheet["date"]:
                        status_map = {
                            "OFF_DUTY": "OFF_DUTY",
                            "SLEEPER": "SLEEPER",
                            "DRIVING": "DRIVING",
                            "ON_DUTY_ND": "ON_DUTY_ND"
                        }
                        events_to_create.append(ELDEvent(
                            eld_log_day=log_day,
                            status=status_map.get(event["status"], "OFF_DUTY"),
                            start_time=evt_time,
                            end_time=evt_end,
                            location_name=event["location"],
                            remarks=event["remarks"]
                        ))
            
            if events_to_create:
                ELDEvent.objects.bulk_create(events_to_create)
                        
        # Format fully nested response payload
        out_serializer = TripOutputSerializer(trip)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class TripDetailViewSet(APIView):
    """
    Trip detail view for fetching, deleting, and duplicating existing plans.
    """
    def delete(self, request, pk):
        try:
            if request.user.is_authenticated:
                trip = Trip.objects.get(pk=pk, user=request.user)
            else:
                trip = Trip.objects.get(pk=pk, user=None)
            trip.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Trip.DoesNotExist:
            return Response({"error": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk):
        # Duplication logic cloning nested stops, log days and events atomically
        try:
            with transaction.atomic():
                if request.user.is_authenticated:
                    original = Trip.objects.get(pk=pk, user=request.user)
                else:
                    original = Trip.objects.get(pk=pk, user=None)
                
                # Clone Trip
                cloned_trip = Trip.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    current_location_name=original.current_location_name,
                    current_location_lat=original.current_location_lat,
                    current_location_lng=original.current_location_lng,
                    pickup_location_name=original.pickup_location_name,
                    pickup_location_lat=original.pickup_location_lat,
                    pickup_location_lng=original.pickup_location_lng,
                    dropoff_location_name=original.dropoff_location_name,
                    dropoff_location_lat=original.dropoff_location_lat,
                    dropoff_location_lng=original.dropoff_location_lng,
                    start_cycle_used_hours=original.start_cycle_used_hours,
                    total_distance_miles=original.total_distance_miles,
                    total_duration_hours=original.total_duration_hours
                )
                
                # Clone Stops
                for stop in original.stops.all():
                    Stop.objects.create(
                        trip=cloned_trip,
                        stop_type=stop.stop_type,
                        location_name=stop.location_name,
                        latitude=stop.latitude,
                        longitude=stop.longitude,
                        arrival_time=stop.arrival_time,
                        duration_hours=stop.duration_hours,
                        distance_from_start_miles=stop.distance_from_start_miles
                    )
                
                # Clone ELD Log Days & Events
                for log_day in original.eld_days.all():
                    cloned_day = ELDLogDay.objects.create(
                        trip=cloned_trip,
                        log_date=log_day.log_date,
                        driving_hours=log_day.driving_hours,
                        on_duty_hours=log_day.on_duty_hours,
                        off_duty_hours=log_day.off_duty_hours,
                        sleeper_berth_hours=log_day.sleeper_berth_hours
                    )
                    
                    for event in log_day.events.all():
                        ELDEvent.objects.create(
                            eld_log_day=cloned_day,
                            status=event.status,
                            start_time=event.start_time,
                            end_time=event.end_time,
                            location_name=event.location_name,
                            remarks=event.remarks
                        )
                
                serializer = TripOutputSerializer(cloned_trip)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Trip.DoesNotExist:
            return Response({"error": "Original trip not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Failed to duplicate trip: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
