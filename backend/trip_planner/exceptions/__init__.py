from rest_framework.exceptions import APIException
from rest_framework import status

class ValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Validation validation checks failed.'
    default_code = 'validation_failed'

class RoutingError(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = 'Routing calculation failed.'
    default_code = 'routing_failed'

class TripPlanningError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Trip planning calculation failed.'
    default_code = 'trip_planning_failed'

class DatabaseError(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Database query operation failed.'
    default_code = 'database_error'

class ConfigurationError(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Application configuration error.'
    default_code = 'configuration_error'
