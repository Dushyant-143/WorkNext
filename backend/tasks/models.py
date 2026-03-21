from django.db import models
from users.models import User

class Task(models.Model):
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('assigned_to_teamlead', 'Assigned to Team Lead'),
        ('assigned_to_developer', 'Assigned to Developer'),
        ('in_progress', 'In Progress'),
        ('blocked', 'Blocked'),
        ('review', 'Under Review'),
        ('submitted', 'Submitted to Manager'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='todo')
    due_date = models.DateField(null=True, blank=True)

    # Task flow - manager assigns to team lead, team lead assigns to developer
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
    assigned_to_manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='manager_tasks')
    assigned_to_teamlead = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='teamlead_tasks')
    assigned_to_developer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='developer_tasks')

    # Acceptance tracking
    accepted_by_teamlead = models.BooleanField(default=False)
    accepted_by_developer = models.BooleanField(default=False)
    rejected_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class ActivityLog(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activity_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=500)
    timestamp = models.DateTimeField(auto_now_add=True)
