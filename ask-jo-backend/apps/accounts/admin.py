from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'username', 'preferred_language', 'age_range', 'is_active', 'created_at']
    list_filter = ['preferred_language', 'is_active', 'is_staff']
    search_fields = ['email', 'username']
    ordering = ['-created_at']

    fieldsets = UserAdmin.fieldsets + (
        ('Ask Jo Profile', {
            'fields': ('preferred_language', 'age_range')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Ask Jo Profile', {
            'fields': ('email', 'preferred_language', 'age_range')
        }),
    )