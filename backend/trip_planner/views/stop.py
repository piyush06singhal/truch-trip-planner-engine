from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class StopViewSet(APIView):
    """
    Placeholder ViewSet for Stop resource queries.
    """
    def get(self, request):
        return Response(
            {
                "status": "success", 
                "message": "Retrieve planned stops details (Not Implemented)"
            }, 
            status=status.HTTP_501_NOT_IMPLEMENTED
        )
