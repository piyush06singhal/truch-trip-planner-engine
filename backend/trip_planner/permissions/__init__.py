from rest_framework.permissions import BasePermission

class ReadOnlyOrAnonymousAccess(BasePermission):
    """
    Custom permission allowing anonymous users to create/query compliance sheets, 
    designed to integrate user authentication checks in subsequent updates.
    """
    def has_permission(self, request, view) -> bool:
        # Lay architecture structure: returns True for all requests to support anonymous plan generation
        return True
