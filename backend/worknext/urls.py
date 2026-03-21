from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def create_owner(request):
    from users.models import User
    if not User.objects.filter(role='owner').exists():
        u = User.objects.create_superuser('admin', 'admin@worknext.com', 'Admin@123')
        u.role = 'owner'
        u.save()
        return JsonResponse({'status': 'Owner created!'})
    return JsonResponse({'status': 'Owner already exists'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('users.urls')),
    path('api/v1/tasks/', include('tasks.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),
    path('setup/', create_owner),
]