from typing import Dict, Any, List, Tuple
from .geometry_service import GeometryService
from ..utils import meters_to_miles, seconds_to_hours

class RouteParser:
    """
    Parses raw OSRM JSON API response objects into standardized dict structures.
    """
    @staticmethod
    def parse_osrm_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses OSRM routing data, decoding polylines and converting metrics.
        """
        if not data or "routes" not in data or not data["routes"]:
            raise ValueError("OSRM response payload contains no valid route path.")
            
        route_data = data["routes"][0]
        
        # 1. Parse top-level route geometry
        encoded_geom = route_data.get("geometry", "")
        geometry = GeometryService.decode_polyline(encoded_geom)
        
        # 2. Extract metrics
        distance_miles = meters_to_miles(route_data.get("distance", 0.0))
        duration_hours = seconds_to_hours(route_data.get("duration", 0.0))
        
        legs = []
        for leg_data in route_data.get("legs", []):
            leg_distance = meters_to_miles(leg_data.get("distance", 0.0))
            leg_duration = seconds_to_hours(leg_data.get("duration", 0.0))
            
            steps = []
            for step_data in leg_data.get("steps", []):
                maneuver = step_data.get("maneuver", {})
                instruction = maneuver.get("instruction", "Drive")
                
                step_dist = meters_to_miles(step_data.get("distance", 0.0))
                step_dur = seconds_to_hours(step_data.get("duration", 0.0))
                
                step_geom_encoded = step_data.get("geometry", "")
                step_geom = GeometryService.decode_polyline(step_geom_encoded) if step_geom_encoded else []
                
                steps.append({
                    "instruction": instruction,
                    "distance_miles": step_dist,
                    "duration_hours": step_dur,
                    "geometry": step_geom
                })
                
            legs.append({
                "distance_miles": leg_distance,
                "duration_hours": leg_duration,
                "steps": steps
            })
            
        return {
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": geometry,
            "legs": legs
        }
