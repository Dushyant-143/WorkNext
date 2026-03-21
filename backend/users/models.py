from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('owner', 'Owner'),
        ('manager', 'Manager'),
        ('team_lead', 'Team Lead'),
        ('developer', 'Developer'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='developer')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_owner(self): return self.role == 'owner'
    @property
    def is_manager(self): return self.role == 'manager'
    @property
    def is_team_lead(self): return self.role == 'team_lead'
    @property
    def is_developer(self): return self.role == 'developer'
