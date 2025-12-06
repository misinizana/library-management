from django.shortcuts import render
import requests
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Book, User
from .serializers import BookSerializer, BookCreateUpdateSerializer, UserSerializer, UserDetailSerializer
from .llm_service.sql_service import process_query
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta

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

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_update_book(request, pk):
    """Update any book (admin only)"""
    try:
        book = Book.objects.get(pk=pk)
        serializer = BookCreateUpdateSerializer(book, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(BookSerializer(book).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_get_all_users(request):
    """Get all users (admin only)"""
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_get_user_detail(request, pk):
    """Get detailed user info with their books and stats (admin only)"""
    try:
        user = User.objects.get(pk=pk)
        serializer = UserDetailSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_update_user(request, pk):
    """Update user info (admin only)"""
    try:
        user = User.objects.get(pk=pk)
        
        user.username = request.data.get('username', user.username)
        user.email = request.data.get('email', user.email)
        user.is_admin = request.data.get('is_admin', user.is_admin)
        
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_books_external(request):
    """Search books using Google Books API"""
    query = request.GET.get('q', '')
    
    if not query:
        return Response({'error': 'Query parameter required'}, status=400)
    
    try:
        url = f'https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=20'
        response = requests.get(url, verify=False)
        data = response.json()
        
        books = []
        for item in data.get('items', []):
            volume_info = item.get('volumeInfo', {})
            
            book = {
                'google_id': item.get('id'),
                'title': volume_info.get('title', 'Unknown Title'),
                'authors': volume_info.get('authors', ['Unknown Author']),
                'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                'description': volume_info.get('description', ''),
                'cover_image': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                'published_date': volume_info.get('publishedDate', ''),
                'page_count': volume_info.get('pageCount', 0),
                'categories': volume_info.get('categories', []),
            }
            books.append(book)
        
        return Response({'results': books})
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
    


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_get_analytics(request):
    """Get analytics data for admin dashboard"""
    
    # Summary Stats
    total_users = User.objects.count()
    active_users = User.objects.annotate(book_count=Count('books')).filter(book_count__gt=0).count()
    total_books = Book.objects.count()
    avg_books = Book.objects.values('user').annotate(count=Count('id')).aggregate(Avg('count'))['count__avg'] or 0
    
    # Books Added Over Time (last 30 days)
    thirty_days_ago = timezone.now() - timedelta(days=30)
    books_over_time = Book.objects.filter(created_at__gte=thirty_days_ago) \
        .extra(select={'date': 'DATE(created_at)'}) \
        .values('date') \
        .annotate(count=Count('id')) \
        .order_by('date')
    
    # Genre Distribution
    genre_distribution = Book.objects.values('genre') \
        .annotate(count=Count('id')) \
        .order_by('-count')
    
    # Popular Books (owned by 2+ users)
    popular_books = Book.objects.values('title', 'author') \
        .annotate(user_count=Count('user', distinct=True)) \
        .filter(user_count__gt=1) \
        .order_by('-user_count')[:10]
    
    # Recent Activity (last 10 books)
    recent_books = Book.objects.select_related('user').order_by('-created_at')[:10]
    recent_activity = [
        {
            'id': book.id,
            'title': book.title,
            'author': book.author,
            'username': book.user.username,
            'added_at': book.created_at
        }
        for book in recent_books
    ]
    
    return Response({
        'summary': {
            'total_users': total_users,
            'active_users': active_users,
            'total_books': total_books,
            'avg_books_per_user': round(avg_books, 2)
        },
        'books_over_time': list(books_over_time),
        'genre_distribution': list(genre_distribution),
        'popular_books': list(popular_books),
        'recent_activity': recent_activity
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_query(request):
    """
    AI-powered natural language query endpoint
    
    Accepts a natural language question and returns:
    - Generated SQL query
    - Query results
    - Natural language formatted answer
    
    Users can only query their own data.
    Admins can query all data.
    """
    question = request.data.get('question', '').strip()
    
    if not question:
        return Response(
            {'error': 'Question is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Process the query through LLM service
    result = process_query(question, request.user)
    
    if result['success']:
        return Response({
            'question': question,
            'sql': result['sql'],
            'results': result['results'],
            'answer': result['answer']
        })
    else:
        return Response(
            {
                'error': result['error'],
                'sql': result['sql']
            },
            status=status.HTTP_400_BAD_REQUEST
        )