from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('fr', 'French'),
    ]

    AGE_RANGE_CHOICES = [
        ('15-20', '15-20'),
        ('21-25', '21-25'),
        ('26-30', '26-30'),
        ('31-35', '31-35'),
    ]

    email = models.EmailField(unique=True)
    preferred_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='en'
    )
    age_range = models.CharField(
        max_length=10,
        choices=AGE_RANGE_CHOICES,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email