import logging
import requests
import time
from typing import Tuple, Dict, Any, List
from .geometry_service import GeometryService
from .route_parser import RouteParser
from ..exceptions import RoutingError

logger = logging.getLogger('trip_planner')

class RoutingService:
    """
    Client connecting to the OSRM Driving Routing API, including bounding box 
    decoding, exponential retries, and a resilient geodetic Haversine fallback.
    """
    def __init__(self):
        self.osrm_base_url = "http://router.project-osrm.org/route/v1/driving"

    def get_route(self, origin: Tuple[float, float], destination: Tuple[float, float]) -> Dict[str, Any]:
        """
        Queries OSRM driving engine. In case of downtime or rate limits, falls back 
        to Haversine geometry calculation.
        """
        lat1, lon1 = origin
        lat2, lon2 = destination
        
        # OSRM coordinates are specified as {lon},{lat}
        url = f"{self.osrm_base_url}/{lon1},{lat1};{lon2},{lat2}"
        params = {
            "overview": "full",
            "geometries": "polyline",
            "steps": "true"
        }
        
        max_retries = 3
        delay = 1.0
        response_data = None
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=5.0)
                if response.status_code == 429:
                    logger.warning("Throttled by OSRM API. Waiting for retry...")
                    time.sleep(2.0)
                    continue
                response.raise_for_status()
                response_data = response.json()
                break
            except (requests.exceptions.RequestException, ValueError) as e:
                logger.warning(f"OSRM routing failed (Attempt {attempt+1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
                    
        # Parse OSRM route response if query succeeded
        if response_data and "routes" in response_data and response_data["routes"]:
            try:
                parsed = RouteParser.parse_osrm_response(response_data)
                parsed["bounding_box"] = self._calculate_bounding_box(parsed["geometry"])
                return parsed
            except Exception as parse_error:
                logger.error(f"Error parsing OSRM routing response: {parse_error}")
                
        # Resilient Geodetic Fallback
        logger.warning(f"OSRM offline. Implementing geodetic fallback from ({lat1}, {lon1}) to ({lat2}, {lon2}).")
        distance_miles = GeometryService.calculate_haversine_distance(origin, destination)
        # Estimate duration at standard average speed (60 mph)
        duration_hours = round(distance_miles / 60.0, 2)
        
        # Fallback geometry is a straight line
        geometry = [origin, destination]
        bounding_box = self._calculate_bounding_box(geometry)
        
        return {
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": geometry,
            "bounding_box": bounding_box,
            "legs": [
                {
                    "distance_miles": distance_miles,
                    "duration_hours": duration_hours,
                    "steps": [
                        {
                            "instruction": f"Drive from coordinates ({lat1}, {lon1}) to ({lat2}, {lon2}) via fallback path",
                            "distance_miles": distance_miles,
                            "duration_hours": duration_hours,
                            "geometry": geometry
                        }
                    ]
                }
            ]
        }

    def _calculate_bounding_box(self, geometry: List[Tuple[float, float]]) -> Dict[str, float]:
        """
        Calculate bounding box coordinates from a list of latitude/longitude points.
        """
        if not geometry:
            return {"min_lat": 0.0, "max_lat": 0.0, "min_lng": 0.0, "max_lng": 0.0}
            
        lats = [point[0] for point in geometry]
        lngs = [point[1] for point in geometry]
        
        return {
            "min_lat": min(lats),
            "max_lat": max(lats),
            "min_lng": min(lngs),
            "max_lng": max(lngs)
        }
