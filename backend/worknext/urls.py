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
        # Delete existing admin and create fresh owner account
        User.objects.filter(username='admin').delete()
        u = User.objects.create_superuser(
            username='admin',
            email='admin@worknext.com',
            password='Admin@123'
        )
        u.role = 'owner'
        u.save()
        return JsonResponse({'status': 'success', 'message': 'Owner reset!'})
    except Exception as e:
        import traceback
        return JsonResponse({'error': str(e), 'trace': traceback.format_exc()})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/tasks/', include('tasks.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('setup/', setup),
]