from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Book, User
from .serializers import BookSerializer, BookCreateUpdateSerializer, UserSerializer

class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Book CRUD operations
    Users can only see and manage their own books
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BookCreateUpdateSerializer
        return BookSerializer
    
    def get_queryset(self):
        # Users only see their own books
        return Book.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Automatically assign the book to the logged-in user
        serializer.save(user=self.request.user)


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_get_all_books(request):
    """Get all books (admin only)"""
    books = Book.objects.all()
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_delete_book(request, pk):
    """Delete any book (admin only)"""
    try:
        book = Book.objects.get(pk=pk)
        book.delete()
        return Response({'message': 'Book deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_get_all_users(request):
    """Get all users (admin only)"""
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_delete_user(request, pk):
    """Delete any user (admin only)"""
    try:
        user = User.objects.get(pk=pk)
        if user == request.user:
            return Response({'error': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
