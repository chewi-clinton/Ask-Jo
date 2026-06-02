from django.db import models
from apps.accounts.models import CustomUser


class Conversation(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=200, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        return self.title or f'Conversation {self.id}'


class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_crisis_flagged = models.BooleanField(default=False)

    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']

    def __str__(self):
        return f'{self.role}: {self.content[:50]}'