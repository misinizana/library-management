from rest_framework import serializers
from .models import User, Book

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_admin']
        read_only_fields = ['id']

class BookSerializer(serializers.ModelSerializer):
    """Serializer for Book model"""
    user = serializers.ReadOnlyField(source='user.id')
    
    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'genre', 'status', 'user', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class BookCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating books"""
    class Meta:
        model = Book
        fields = ['title', 'author', 'genre', 'status']
