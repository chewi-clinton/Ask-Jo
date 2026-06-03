from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id',
            'role',
            'content',
            'timestamp',
            'is_crisis_flagged',
        ]
        read_only_fields = ['id', 'timestamp', 'is_crisis_flagged']


class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'title',
            'created_at',
            'updated_at',
            'message_count',
            'last_message',
        ]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.order_by('-timestamp').first()
        if last:
            return {
                'role': last.role,
                'content': last.content[:100],
                'timestamp': last.timestamp,
            }
        return None


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'title',
            'created_at',
            'updated_at',
            'messages',
        ]


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['title']

    def create(self, validated_data):
        user = self.context['request'].user
        return Conversation.objects.create(
            user=user,
            title=validated_data.get('title', '')
        )


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    location = serializers.CharField(required=False, allow_blank=True, default='')


class GuestMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['user', 'assistant'])
    content = serializers.CharField()
    timestamp = serializers.DateTimeField(required=False)


class GuestMigrationSerializer(serializers.Serializer):
    messages = GuestMessageSerializer(many=True)
    title = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_messages(self, value):
        if not value:
            raise serializers.ValidationError('Messages list cannot be empty.')
        return value