from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator
from .models import Task, Comment, ActivityLog
from .serializers import TaskSerializer, TaskListSerializer, CommentSerializer
from users.permissions import IsOwnerOrManager, IsOwnerOrManagerOrTeamLead
from users.models import User


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'owner':
            queryset = Task.objects.all()
        elif user.role == 'manager':
            queryset = Task.objects.filter(created_by=user)
        elif user.role == 'team_lead':
            queryset = Task.objects.filter(assigned_to_teamlead=user)
        else:
            queryset = Task.objects.filter(assigned_to_developer=user)

        status_f   = request.query_params.get('status')
        priority_f = request.query_params.get('priority')
        search     = request.query_params.get('search')

        if status_f:   queryset = queryset.filter(status=status_f)
        if priority_f: queryset = queryset.filter(priority=priority_f)
        if search:     queryset = queryset.filter(title__icontains=search)

        queryset = queryset.select_related(
            'created_by', 'assigned_to_teamlead', 'assigned_to_developer'
        ).order_by('-created_at')

        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        paginator = Paginator(queryset, page_size)
        page_obj  = paginator.get_page(page)

        return Response({
            'results':      TaskListSerializer(page_obj.object_list, many=True).data,
            'count':        paginator.count,
            'total_pages':  paginator.num_pages,
            'current_page': page,
            'has_next':     page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        })

    def post(self, request):
        if request.user.role not in ['owner', 'manager']:
            return Response(
                {'error': 'Only managers can create tasks'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            assigned_tl = serializer.validated_data.get('assigned_to_teamlead')
            initial_status = 'assigned_to_teamlead' if assigned_tl else 'todo'
            task = serializer.save(
                created_by=request.user,
                status=initial_status
            )
            log_msg = f"Task created by {request.user.username}"
            if assigned_tl:
                log_msg += f" and assigned to team lead {assigned_tl.username}"
            ActivityLog.objects.create(task=task, user=request.user, action=log_msg)
            return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_task(self, pk, user):
        try:
            task = Task.objects.select_related(
                'created_by', 'assigned_to_teamlead', 'assigned_to_developer'
            ).get(pk=pk)
            if user.role == 'owner':
                return task
            if user.role == 'manager' and task.created_by == user:
                return task
            if user.role == 'team_lead' and task.assigned_to_teamlead == user:
                return task
            if user.role == 'developer' and task.assigned_to_developer == user:
                return task
            return None
        except Task.DoesNotExist:
            return None

    def get(self, request, pk):
        task = self.get_task(pk, request.user)
        if not task:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TaskSerializer(task).data)

    def put(self, request, pk):
        user = request.user
        if user.role not in ['owner', 'manager']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        # Managers can only edit tasks they created
        if user.role == 'manager' and task.created_by != user:
            return Response({'error': 'You can only edit your own tasks'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TaskSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            ActivityLog.objects.create(
                task=task, user=request.user,
                action=f"Task updated by {request.user.username}"
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = request.user
        if user.role not in ['owner', 'manager']:
            return Response({'error': 'Only managers can delete tasks'}, status=status.HTTP_403_FORBIDDEN)
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        # Managers can only delete tasks they created
        if user.role == 'manager' and task.created_by != user:
            return Response({'error': 'You can only delete your own tasks'}, status=status.HTTP_403_FORBIDDEN)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatusUpdateView(APIView):
    """PATCH /tasks/:id/status/"""
    permission_classes = [IsAuthenticated]

    VALID_TRANSITIONS = {
        'owner':     ['todo', 'assigned_to_teamlead', 'assigned_to_developer',
                      'in_progress', 'blocked', 'submitted', 'completed', 'rejected'],
        'manager':   ['todo', 'assigned_to_teamlead', 'in_progress',
                      'blocked', 'submitted', 'completed', 'rejected'],
        'team_lead': ['in_progress', 'blocked', 'assigned_to_developer'],
        'developer': ['in_progress', 'blocked', 'submitted'],
    }

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'status field required'}, status=status.HTTP_400_BAD_REQUEST)

        user    = request.user
        allowed = self.VALID_TRANSITIONS.get(user.role, [])

        if user.role == 'developer' and task.assigned_to_developer != user:
            return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == 'team_lead' and task.assigned_to_teamlead != user:
            return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)

        if new_status not in allowed:
            return Response(
                {'error': f'You cannot set status to {new_status}'},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status   = task.status
        task.status  = new_status
        task.save()

        ActivityLog.objects.create(
            task=task, user=user,
            action=f"Status changed from '{old_status}' to '{new_status}' by {user.username}"
        )
        return Response(TaskSerializer(task).data)


class TaskActionView(APIView):
    """POST /tasks/:id/action/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action')
        user   = request.user

        if action == 'accept_teamlead':
            if task.assigned_to_teamlead != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            # FIX: Already accepted check
            if task.accepted_by_teamlead:
                return Response({'error': 'Task already accepted'}, status=status.HTTP_400_BAD_REQUEST)
            task.accepted_by_teamlead = True
            task.status = 'in_progress'
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task accepted by Team Lead {user.username}")

        elif action == 'reject_teamlead':
            if task.assigned_to_teamlead != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            # FIX: Already accepted check
            if task.accepted_by_teamlead:
                return Response({'error': 'Cannot reject an already accepted task'}, status=status.HTTP_400_BAD_REQUEST)
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)
            task.status          = 'rejected'
            task.rejected_reason = reason
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task rejected by Team Lead {user.username}: {reason}")

        elif action == 'assign_developer':
            if task.assigned_to_teamlead != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            developer_id = request.data.get('developer_id')
            if not developer_id:
                return Response({'error': 'developer_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                dev = User.objects.get(pk=developer_id, role='developer')
                task.assigned_to_developer = dev
                task.status = 'assigned_to_developer'
                ActivityLog.objects.create(task=task, user=user,
                    action=f"Task assigned to developer {dev.username} by {user.username}")
            except User.DoesNotExist:
                return Response({'error': 'Developer not found'}, status=status.HTTP_404_NOT_FOUND)

        elif action == 'accept_developer':
            if task.assigned_to_developer != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            # FIX: Already accepted check
            if task.accepted_by_developer:
                return Response({'error': 'Task already accepted'}, status=status.HTTP_400_BAD_REQUEST)
            task.accepted_by_developer = True
            task.status = 'in_progress'
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task accepted by Developer {user.username}")

        elif action == 'reject_developer':
            if task.assigned_to_developer != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            # FIX: Already accepted check
            if task.accepted_by_developer:
                return Response({'error': 'Cannot reject an already accepted task'}, status=status.HTTP_400_BAD_REQUEST)
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)
            task.status          = 'rejected'
            task.rejected_reason = reason
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task rejected by Developer {user.username}: {reason}")

        elif action == 'mark_complete':
            if task.assigned_to_developer != user:
                return Response({'error': 'Not your task'}, status=status.HTTP_403_FORBIDDEN)
            task.status = 'submitted'
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task submitted for review by {user.username}")

        elif action == 'approve_manager':
            if user.role not in ['owner', 'manager']:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            task.status = 'completed'
            ActivityLog.objects.create(task=task, user=user,
                action=f"Task approved and completed by {user.username}")

        else:
            return Response({'error': f'Invalid action: {action}'}, status=status.HTTP_400_BAD_REQUEST)

        task.save()
        return Response(TaskSerializer(task).data)


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class    = CommentSerializer
    permission_classes  = [IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(task__id=self.kwargs['pk']).order_by('created_at')

    def perform_create(self, serializer):
        try:
            task = Task.objects.get(pk=self.kwargs['pk'])
        except Task.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Task not found')

        # Only assigned users and managers can comment on a task
        user = self.request.user
        has_access = (
            user.role in ['owner', 'manager'] or
            task.assigned_to_teamlead == user or
            task.assigned_to_developer == user
        )
        if not has_access:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have access to this task')

        serializer.save(user=user, task=task)
        ActivityLog.objects.create(
            task=task, user=user,
            action=f"Comment added by {user.username}"
        )