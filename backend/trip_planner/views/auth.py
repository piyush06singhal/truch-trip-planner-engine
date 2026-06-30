from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
import logging

logger = logging.getLogger('trip_planner')

class RegisterView(APIView):
    """
    Endpoint to register a new user CDL profile.
    Generates and returns an authentication Token on success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username is already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create user account
            user = User.objects.create_user(username=username, email=email, password=password)
            token = Token.objects.create(user=user)
            
            return Response({
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"User registration failure: {e}")
            return Response(
                {"error": "An error occurred during account creation."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class LoginView(APIView):
    """
    Endpoint to authenticate driver credentials.
    Returns existing or new Token along with user metadata.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "token": token.key,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Invalid username or password credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )

class LogoutView(APIView):
    """
    Endpoint to invalidate the current active Token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response(
                {"message": "Logged out successfully. Token invalidated."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"User logout token deletion failure: {e}")
            return Response(
                {"error": "Logout failed. Token invalid or already removed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileView(APIView):
    """
    Endpoint to retrieve current logged-in driver's profile info.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined.isoformat()
        }, status=status.HTTP_200_OK)
