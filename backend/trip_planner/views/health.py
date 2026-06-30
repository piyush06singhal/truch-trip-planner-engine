from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connections
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class HealthCheckView(APIView):
    """
    Exposes system availability metrics, verifying database link states 
    and returning compile tags and timezone timestamps.
    """
    def get(self, request):
        db_status = "connected"
        db_error = None
        try:
            db_conn = connections['default']
            db_conn.cursor()
        except Exception as e:
            db_status = "disconnected"
            db_error = str(e)
            logger.error(f"Health check DB error: {e}")

        is_healthy = db_status == "connected"
        payload = {
            "status": "success" if is_healthy else "error",
            "database": db_status,
            "version": "2.0.0",
            "timestamp": timezone.now().isoformat()
        }
        if db_error:
            payload["detail"] = db_error

        return Response(
            payload,
            status=status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        )
