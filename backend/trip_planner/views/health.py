from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connections
from django.db.utils import OperationalError
from django.utils import timezone

class HealthCheckView(APIView):
    """
    Exposes system availability metrics, verifying database link states 
    and returning compile tags and timezone timestamps.
    """
    def get(self, request):
        db_status = "connected"
        try:
            db_conn = connections['default']
            # Touch the database to verify active connection
            db_conn.cursor()
        except OperationalError:
            db_status = "disconnected"

        is_healthy = db_status == "connected"
        payload = {
            "status": "success" if is_healthy else "error",
            "database": db_status,
            "version": "2.0.0",
            "timestamp": timezone.now().isoformat()
        }
        
        return Response(
            payload, 
            status=status.HTTP_200_OK if is_healthy else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
