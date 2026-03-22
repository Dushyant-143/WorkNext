from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def create_owner(request):
    try:
        # Pehle migrations run karo
        from django.core.management import call_command
        call_command('migrate', '--run-syncdb')
        
        from users.models import User
        if not User.objects.filter(role='owner').exists():
            u = User.objects.create_superuser('admin', 'admin@worknext.com', 'Admin@123')
            u.role = 'owner'
            u.save()
            return JsonResponse({'status': 'Migrations done! Owner created!', 'username': 'admin', 'password': 'Admin@123'})
        return JsonResponse({'status': 'Owner already exists'})
    except Exception as e:
        return JsonResponse({'error': str(e)})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/tasks/', include('tasks.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('setup/', create_owner),
]