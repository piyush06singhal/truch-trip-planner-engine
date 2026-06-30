from ..models import Trip

class TripService:
    """
    Service coordinating the master workflow: geocoding points, querying routes,
    running FMCSA compliance checks, saving outputs, and returning Trip instances.
    """
    def plan_trip(
        self, 
        current_location: str, 
        pickup_location: str, 
        dropoff_location: str, 
        cycle_hours_used: float
    ) -> Trip:
        """
        Plan and store a complete trip, including stops, routes, and ELD log pages.
        """
        raise NotImplementedError("TripService.plan_trip is not implemented.")
