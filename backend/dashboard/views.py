from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from tasks.models import Task
from tasks.serializers import TaskListSerializer
from users.models import User
from users.serializers import UserSerializer
from users.permissions import IsOwner

SR = ('created_by', 'assigned_to_teamlead', 'assigned_to_developer')

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user  = request.user
        today = timezone.now().date()

        if user.role == 'owner':
            all_tasks = Task.objects.all()
            stats = {
                'total':       all_tasks.count(),
                'pending':     all_tasks.exclude(status__in=['completed', 'rejected']).count(),
                'completed':   all_tasks.filter(status='completed').count(),
                'rejected':    all_tasks.filter(status='rejected').count(),
                'submitted':   all_tasks.filter(status='submitted').count(),
                'in_progress': all_tasks.filter(status='in_progress').count(),
            }
            team_leads = User.objects.filter(role='team_lead').count()
            developers = User.objects.filter(role='developer').count()
            extra    = {'team_leads': team_leads, 'developers': developers}
            recent   = all_tasks.filter(status='submitted').select_related(*SR).order_by('-updated_at')[:5]
            upcoming = all_tasks.filter(due_date__gte=today).exclude(status='completed').select_related(*SR).order_by('due_date')[:5]

        elif user.role == 'manager':
            all_tasks = Task.objects.filter(created_by=user)
            stats = {
                'total':       all_tasks.count(),
                'pending':     all_tasks.exclude(status__in=['completed', 'rejected']).count(),
                'completed':   all_tasks.filter(status='completed').count(),
                'rejected':    all_tasks.filter(status='rejected').count(),
                'submitted':   all_tasks.filter(status='submitted').count(),
                'in_progress': all_tasks.filter(status='in_progress').count(),
            }
            team_leads = User.objects.filter(role='team_lead').count()
            developers = User.objects.filter(role='developer').count()
            extra    = {'team_leads': team_leads, 'developers': developers}
            recent   = all_tasks.filter(status='submitted').select_related(*SR).order_by('-updated_at')[:5]
            upcoming = all_tasks.filter(due_date__gte=today).exclude(status='completed').select_related(*SR).order_by('due_date')[:5]

        elif user.role == 'team_lead':
            all_tasks = Task.objects.filter(assigned_to_teamlead=user)
            stats = {
                'total':              all_tasks.count(),
                'pending_acceptance': all_tasks.filter(status='assigned_to_teamlead').count(),
                'assigned_to_dev':    all_tasks.filter(assigned_to_developer__isnull=False).count(),
                'in_progress':        all_tasks.filter(status='in_progress').count(),
                'submitted':          all_tasks.filter(status='submitted').count(),
                'completed':          all_tasks.filter(status='completed').count(),
            }
            extra    = {}
            recent   = all_tasks.select_related(*SR).order_by('-updated_at')[:5]
            upcoming = all_tasks.filter(due_date__gte=today).exclude(status='completed').select_related(*SR).order_by('due_date')[:5]

        else:  # developer
            all_tasks = Task.objects.filter(assigned_to_developer=user)
            stats = {
                'total':              all_tasks.count(),
                'pending_acceptance': all_tasks.filter(status='assigned_to_developer').count(),
                'in_progress':        all_tasks.filter(status='in_progress').count(),
                'submitted':          all_tasks.filter(status='submitted').count(),
                'completed':          all_tasks.filter(status='completed').count(),
                'rejected':           all_tasks.filter(status='rejected').count(),
            }
            extra    = {}
            recent   = all_tasks.select_related(*SR).order_by('-updated_at')[:5]
            upcoming = all_tasks.filter(due_date__gte=today).exclude(status='completed').select_related(*SR).order_by('due_date')[:5]

        return Response({
            'stats':              stats,
            'extra':              extra,
            'upcoming_deadlines': TaskListSerializer(upcoming, many=True).data,
            'recent_tasks':       TaskListSerializer(recent, many=True).data,
        })


class OwnerDashboardView(APIView):
    permission_classes = [IsOwner]

    def get(self, request):
        users = User.objects.all()
        tasks = Task.objects.all()

        return Response({
            'total_users':     users.count(),
            'managers':        UserSerializer(users.filter(role='manager'), many=True).data,
            'team_leads':      UserSerializer(users.filter(role='team_lead'), many=True).data,
            'developers':      UserSerializer(users.filter(role='developer'), many=True).data,
            'total_tasks':     tasks.count(),
            'completed_tasks': tasks.filter(status='completed').count(),
            'pending_tasks':   tasks.exclude(status__in=['completed', 'rejected']).count(),
        })