import os
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def setup(request):
    try:
        from django.core.management import call_command
        import io
        out = io.StringIO()
        call_command('migrate', stdout=out, verbosity=2)
        
        from users.models import User
        username = os.getenv('SETUP_USERNAME', 'admin')
        User.objects.filter(username=username).delete()
        u = User.objects.create_superuser(
            username=username,
            email=os.getenv('SETUP_EMAIL', 'admin@worknext.com'),
            password=os.getenv('SETUP_PASSWORD', 'Admin@123')
        )
        u.role = 'owner'
        u.save()
        return JsonResponse({'status': 'success', 'message': 'Owner reset!'})
    except Exception as e:
        import traceback
        return JsonResponse({'error': str(e), 'trace': traceback.format_exc()})

SETUP_PATH = os.getenv('SETUP_PATH', 'setup')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/tasks/', include('tasks.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path(f'{SETUP_PATH}/', setup),
]