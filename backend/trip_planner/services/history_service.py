from typing import List
from ..models import Trip

class HistoryService:
    """
    Trip history manager retrieving previously stored compliance trip plan summaries.
    """
    def get_user_trip_history(self) -> List[Trip]:
        """
        Queries and returns compiled trips.
        """
        raise NotImplementedError("HistoryService.get_user_trip_history is not implemented.")
