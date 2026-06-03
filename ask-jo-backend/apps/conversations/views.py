import httpx
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    ConversationCreateSerializer,
    SendMessageSerializer,
    GuestMigrationSerializer,
    MessageSerializer,
)


def auto_title(content):
    """Generate a conversation title from the first message."""
    words = content.strip().split()
    title = ' '.join(words[:6])
    return title if len(title) <= 60 else title[:60] + '...'


def call_ai_service(message, history, user_context):
    """Call FastAPI AI service and return response."""
    payload = {
        'message': message,
        'conversation_history': history,
        'user_context': user_context,
    }
    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{settings.AI_SERVICE_URL}/chat/",
                json=payload,
            )
            response.raise_for_status()
            return response.json()
    except httpx.TimeoutException:
        return {
            'reply': (
                "I'm taking a little longer than usual to respond. "
                "Please try again in a moment."
            ),
            'language_detected': user_context.get('preferred_language', 'en'),
            'crisis_flagged': False,
            'sources': [],
            'resources': [],
        }
    except httpx.HTTPError:
        return {
            'reply': (
                "I'm having trouble connecting right now. "
                "Please try again shortly."
            ),
            'language_detected': user_context.get('preferred_language', 'en'),
            'crisis_flagged': False,
            'sources': [],
            'resources': [],
        }


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(user=request.user)
        serializer = ConversationListSerializer(conversations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ConversationCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            conversation = serializer.save()
            return Response(
                ConversationDetailSerializer(conversation).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Conversation.objects.get(pk=pk, user=user)
        except Conversation.DoesNotExist:
            return None

    def get(self, request, pk):
        conversation = self.get_object(pk, request.user)
        if not conversation:
            return Response(
                {'error': 'Conversation not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = ConversationDetailSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        conversation = self.get_object(pk, request.user)
        if not conversation:
            return Response(
                {'error': 'Conversation not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        conversation.delete()
        return Response(
            {'message': 'Conversation deleted.'},
            status=status.HTTP_204_NO_CONTENT
        )


class MessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            conversation = Conversation.objects.get(pk=pk, user=request.user)
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_content = serializer.validated_data['content']
        location = serializer.validated_data.get('location', '')

        # Save user message
        user_message = Message.objects.create(
            conversation=conversation,
            role='user',
            content=user_content,
        )

        # Auto-set conversation title from first message
        if not conversation.title:
            conversation.title = auto_title(user_content)
            conversation.save()

        # Build conversation history for AI (last 10 messages)
        history = list(
            conversation.messages
            .exclude(pk=user_message.pk)
            .order_by('-timestamp')[:10]
            .values('role', 'content')
        )
        history.reverse()

        # Build user context
        user_context = {
            'preferred_language': request.user.preferred_language,
            'location': location,
            'age_range': request.user.age_range or '',
        }

        # Call FastAPI AI service
        ai_response = call_ai_service(user_content, history, user_context)

        # Save assistant message
        assistant_message = Message.objects.create(
            conversation=conversation,
            role='assistant',
            content=ai_response['reply'],
            is_crisis_flagged=ai_response.get('crisis_flagged', False),
        )

        # Update conversation timestamp
        conversation.save()

        return Response({
            'user_message': MessageSerializer(user_message).data,
            'assistant_message': MessageSerializer(assistant_message).data,
            'language_detected': ai_response.get('language_detected', 'en'),
            'crisis_flagged': ai_response.get('crisis_flagged', False),
            'sources': ai_response.get('sources', []),
            'resources': ai_response.get('resources', []),
        }, status=status.HTTP_200_OK)


class MigrateGuestHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = GuestMigrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        messages = serializer.validated_data['messages']
        title = serializer.validated_data.get('title', '')

        if not title and messages:
            first_user_msg = next(
                (m for m in messages if m['role'] == 'user'), None
            )
            if first_user_msg:
                title = auto_title(first_user_msg['content'])

        # Create conversation
        conversation = Conversation.objects.create(
            user=request.user,
            title=title or 'Imported conversation',
        )

        # Bulk create all messages
        message_objects = [
            Message(
                conversation=conversation,
                role=msg['role'],
                content=msg['content'],
            )
            for msg in messages
        ]
        Message.objects.bulk_create(message_objects)

        return Response({
            'message': 'Guest history migrated successfully.',
            'conversation': ConversationDetailSerializer(conversation).data,
        }, status=status.HTTP_201_CREATED)