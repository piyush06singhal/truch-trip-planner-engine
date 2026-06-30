import time
import logging
import requests
from typing import Tuple, Dict, Any, Optional
from .cache_service import CacheService
from ..exceptions import RoutingError, ValidationError

logger = logging.getLogger('trip_planner')

class GeocodingService:
    """
    Client interface for Nominatim OpenStreetMap API, supporting forward and 
    reverse geocoding, client-side caching, and exponential retries.
    """
    def __init__(self):
        self.search_url = "https://nominatim.openstreetmap.org/search"
        self.reverse_url = "https://nominatim.openstreetmap.org/reverse"
        self.headers = {
            "User-Agent": "TruckTripPlannerComplianceEngine/2.0.0 (contact: support@spotterai.com)"
        }
        self.cache = CacheService()

    def _get_request_with_retry(self, url: str, params: Dict[str, Any], max_retries: int = 1) -> requests.Response:
        """
        Execute an HTTP GET request with exponential backoff for transient failures.
        """
        delay = 1.0
        for attempt in range(max_retries):
            try:
                # Respect Nominatim Usage Policy (max 1 request/second)
                time.sleep(1.0)
                response = requests.get(url, headers=self.headers, params=params, timeout=5.0)
                if response.status_code == 429:
                    logger.warning("Throttled by Nominatim API. Throttling wait triggered...")
                    time.sleep(2.0)
                    continue
                response.raise_for_status()
                return response
            except (requests.exceptions.RequestException, TimeoutError) as e:
                if attempt == max_retries - 1:
                    logger.error(f"HTTP lookup failed after {max_retries} attempts: {e}")
                    raise RoutingError(f"Geocoding service unavailable: {e}")
                time.sleep(delay)
                delay *= 2
        raise RoutingError("Geocoding service rate limits exceeded.")

    def geocode_location(self, query: str) -> Tuple[float, float, str]:
        """
        Convert a location name/address string into (latitude, longitude, display_name).
        """
        if not query or not query.strip():
            raise ValidationError("Geocoding lookup query cannot be empty.")
            
        normalized_query = query.strip().lower()
        
        # Check cache
        cached = self.cache.get(f"geocode:{normalized_query}")
        if cached:
            return cached

        params = {
            "q": query,
            "format": "json",
            "limit": 1
        }
        
        try:
            try:
                response = self._get_request_with_retry(self.search_url, params)
                data = response.json()
                
                if not data:
                    raise RoutingError(f"No coordinates found for address search: '{query}'")
                    
                best_match = data[0]
                lat = float(best_match["lat"])
                lon = float(best_match["lon"])
                display_name = best_match["display_name"]
            except Exception as NominatimError:
                logger.warning(f"Nominatim lookup failed: {NominatimError}. Triggering Photon API HTTP fallback...")
                try:
                    # Photon OpenStreetMap Geocoding Web API fallback (bypasses cloud IP blocking/limits)
                    photon_url = "https://photon.komoot.io/api"
                    photon_params = {"q": query, "limit": 1}
                    photon_response = requests.get(photon_url, headers=self.headers, params=photon_params, timeout=5.0)
                    photon_response.raise_for_status()
                    photon_data = photon_response.json()
                    
                    features = photon_data.get("features", [])
                    if not features:
                        raise RoutingError(f"Photon fallback found no coordinates for: '{query}'")
                    
                    best_feat = features[0]
                    coords = best_feat["geometry"]["coordinates"]
                    lon = float(coords[0])
                    lat = float(coords[1])
                    
                    props = best_feat.get("properties", {})
                    display_parts = []
                    for key in ["name", "city", "state", "country"]:
                        val = props.get(key)
                        if val:
                            display_parts.append(str(val))
                    display_name = ", ".join(display_parts) if display_parts else query
                except Exception as PhotonError:
                    logger.error(f"Photon geocoding fallback failed: {PhotonError}")
                    raise RoutingError(f"Geocoding lookup failed. Nominatim error: {NominatimError}; Photon error: {PhotonError}")
            
            result = (lat, lon, display_name)
            
            # Save to cache
            self.cache.set(f"geocode:{normalized_query}", result)
            return result
        except ValueError as e:
            raise RoutingError(f"Geocoding server returned malformed JSON: {e}")

    def reverse_geocode(self, lat: float, lon: float) -> str:
        """
        Convert coordinates into a human-readable display address.
        """
        if lat < -90.0 or lat > 90.0 or lon < -180.0 or lon > 180.0:
            raise ValidationError("Invalid coordinates boundaries for reverse geocoding.")
            
        cache_key = f"reverse:{lat:.5f}:{lon:.5f}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        params = {
            "lat": lat,
            "lon": lon,
            "format": "json"
        }
        
        try:
            response = self._get_request_with_retry(self.reverse_url, params)
            data = response.json()
            
            if not data or "display_name" not in data:
                raise RoutingError(f"No address match found for coordinates: ({lat}, {lon})")
                
            display_name = data["display_name"]
            self.cache.set(cache_key, display_name)
            return display_name
        except ValueError as e:
            raise RoutingError(f"Reverse geocoding server returned malformed response: {e}")
