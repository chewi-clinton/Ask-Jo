from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConversationListView.as_view(), name='conversation-list'),
    path('<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('<int:pk>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('<int:pk>/send/', views.SendMessageView.as_view(), name='send-message'),
    path('migrate/', views.MigrateGuestHistoryView.as_view(), name='migrate-guest'),
]