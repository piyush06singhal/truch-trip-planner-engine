from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class ELDLogViewSet(APIView):
    """
    Placeholder ViewSet for ELD daily sheet compliance resources.
    """
    def get(self, request):
        return Response(
            {
                "status": "success", 
                "message": "Retrieve FMCSA daily compliance logs (Not Implemented)"
            }, 
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
