from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('trip_planner')

def custom_exception_handler(exc, context):
    """
    Format DRF exceptions centrally, structuring output data into 
    standard RFC-like error shapes.
    """
    # Call DRF's default exception handler to obtain the standard structure first
    response = exception_handler(exc, context)

    if response is not None:
        details = {}
        message = "An API error occurred."
        code = getattr(exc, 'default_code', 'api_error')
        
        # Check if response payload contains dictionary validation sets
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                message = response.data['detail']
            else:
                details = response.data
                message = "Validation check failed."
                code = "validation_failed"
        elif isinstance(response.data, list):
            message = response.data[0]
            
        response.data = {
            "status": "error",
            "error": {
                "code": code.upper(),
                "message": message,
                "details": details
            }
        }
    else:
        # Logs unhandled runtime exceptions
        logger.exception("Unhandled Server Exception Intercepted")
        
        response = Response({
            "status": "error",
            "error": {
                "code": "SERVER_ERROR",
                "message": str(exc) if getattr(exc, 'args', None) else "An internal server error occurred.",
                "details": {}
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
