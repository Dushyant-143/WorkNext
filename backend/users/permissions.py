from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'owner'

class IsOwnerOrManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['owner', 'manager']

class IsOwnerOrManagerOrTeamLead(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['owner', 'manager', 'team_lead']

class IsAuthenticatedWithRole(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
