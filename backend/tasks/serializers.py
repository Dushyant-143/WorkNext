from rest_framework import serializers
from .models import Task, Comment, ActivityLog
from users.serializers import UserSerializer
from users.models import User


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'content', 'created_at']


class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'timestamp']


class TaskSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to_teamlead = UserSerializer(read_only=True)
    assigned_to_developer = UserSerializer(read_only=True)
    assigned_to_teamlead_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='team_lead'),
        source='assigned_to_teamlead', write_only=True, required=False, allow_null=True
    )
    assigned_to_developer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='developer'),
        source='assigned_to_developer', write_only=True, required=False, allow_null=True
    )
    comments = CommentSerializer(many=True, read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = '__all__'


class TaskListSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    assigned_to_teamlead = UserSerializer(read_only=True)
    assigned_to_developer = UserSerializer(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status', 'due_date',
            'created_by', 'assigned_to_teamlead', 'assigned_to_developer',
            'accepted_by_teamlead', 'accepted_by_developer', 'created_at', 'updated_at',
        ]
