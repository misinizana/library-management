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
        fields = ['id', 'title', 'author', 'genre', 'status', 'user', 
                  'cover_image', 'description', 'page_count', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class BookCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating books"""
    class Meta:
        model = Book
        fields = ['title', 'author', 'genre', 'status', 'cover_image', 'description', 'page_count']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for user with their books and stats"""
    books = BookSerializer(many=True, read_only=True)
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_admin', 'date_joined', 'books', 'stats']
        read_only_fields = ['id', 'date_joined']
    
    def get_stats(self, obj):
        books = obj.books.all()
        return {
            'total_books': books.count(),
            'books_reading': books.filter(status='reading').count(),
            'books_completed': books.filter(status='completed').count(),
            'books_to_read': books.filter(status='to_read').count(),
        }
