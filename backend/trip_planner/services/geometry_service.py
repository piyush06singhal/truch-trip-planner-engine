import math
from typing import List, Tuple

class GeometryService:
    """
    Service for geodetic spatial math, including Google Polyline decoding 
    and Haversine great-circle distance calculations.
    """
    @staticmethod
    def decode_polyline(polyline_str: str, precision: int = 5) -> List[Tuple[float, float]]:
        """
        Decodes a Google polyline algorithm string into a list of (latitude, longitude) coordinate floats.
        """
        if not polyline_str:
            return []
        
        factor = 10 ** precision
        index, lat, lng = 0, 0, 0
        coordinates: List[Tuple[float, float]] = []
        length = len(polyline_str)
        
        while index < length:
            # Decode latitude coordinate difference
            shift, result = 0, 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if not (b & 0x20):
                    break
            dlat = ~(result >> 1) if (result & 1) else (result >> 1)
            lat += dlat
            
            # Decode longitude coordinate difference
            shift, result = 0, 0
            while True:
                b = ord(polyline_str[index]) - 63
                index += 1
                result |= (b & 0x1f) << shift
                shift += 5
                if not (b & 0x20):
                    break
            dlng = ~(result >> 1) if (result & 1) else (result >> 1)
            lng += dlng
            
            coordinates.append((lat / factor, lng / factor))
            
        return coordinates

    @staticmethod
    def calculate_haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculates the great-circle distance between two geodetic coordinate points 
        in miles using the Haversine formula.
        """
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        # Earth's average radius in miles
        r = 3958.8
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_phi / 2) ** 2 + 
             math.cos(phi1) * math.cos(phi2) * 
             math.sin(delta_lambda / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return round(r * c, 2)
