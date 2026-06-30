from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
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

class RequestPasswordResetView(APIView):
    """
    Endpoint to request password reset instructions.
    Generates a verification token and dispatches an SMTP email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "Registered email address is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        users = User.objects.filter(email=email)
        if not users.exists():
            return Response(
                {"error": "No driver profile exists with this email address."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            for user in users:
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Dynamic compilation of reset link (pointing to frontend reset path)
                reset_link = f"https://truch-trip-planner-engine.vercel.app/reset-password/{uid}/{token}/"
                
                subject = "SpotterAI CDL Driver Password Reset Request"
                message = (
                    f"Hello {user.username},\n\n"
                    f"You requested a password reset for your SpotterAI CDL profile.\n"
                    f"Please click the link below to verify and select a new secure password:\n\n"
                    f"{reset_link}\n\n"
                    f"If you did not initiate this transaction, please ignore this email.\n\n"
                    f"Best regards,\n"
                    f"SpotterAI Compliance Team"
                )
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False
                )
            
            return Response(
                {"message": f"Password reset instructions successfully sent to {email}."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"SMTP dispatch failure: {e}")
            return Response(
                {"error": "SMTP mail server dispatch failed. Please configure backend SMTP credentials in Render settings.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConfirmPasswordResetView(APIView):
    """
    Endpoint to confirm and save the new password.
    Validates token generator signatures.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response(
                {"error": "Missing uid, token, or new password parameters."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid driver reference link details."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Verification token signature is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user.set_password(new_password)
            user.save()
            return Response(
                {"message": "Driver password updated successfully. Please sign in with your new password."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Password update failure: {e}")
            return Response(
                {"error": "An error occurred during password compilation."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
