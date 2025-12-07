from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    admin_get_all_books,
    admin_delete_book,
    admin_update_book,
    admin_get_all_users,
    admin_get_user_detail,
    admin_update_user,
    admin_delete_user,
    search_books_external,
    admin_get_analytics,
    conversation_list,           
    conversation_detail,         
    send_message,               
    clear_all_conversations,
    get_book_recommendations    
)

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')

urlpatterns = [
    # Search endpoint
    path('books/search/', search_books_external, name='search-books'),
    
    # AI Query endpoint (keep for backwards compatibility, but we'll use conversations now)
    # path('ai/query/', ai_query, name='ai-query'),
    
    # Conversation endpoints
    path('conversations/', conversation_list, name='conversation-list'),
    path('conversations/<int:pk>/', conversation_detail, name='conversation-detail'),
    path('conversations/<int:pk>/message/', send_message, name='send-message'),
    path('conversations/clear/', clear_all_conversations, name='clear-conversations'),
    path('recommendations/', get_book_recommendations, name='recommendations'),
    
    # Admin - Books
    path('admin/books/', admin_get_all_books, name='admin-books'),
    path('admin/books/<int:pk>/', admin_delete_book, name='admin-delete-book'),
    path('admin/books/<int:pk>/update/', admin_update_book, name='admin-update-book'),
    
    # Admin - Users
    path('admin/users/', admin_get_all_users, name='admin-users'),
    path('admin/users/<int:pk>/', admin_get_user_detail, name='admin-user-detail'),
    path('admin/users/<int:pk>/update/', admin_update_user, name='admin-update-user'),
    path('admin/users/<int:pk>/delete/', admin_delete_user, name='admin-delete-user'),
    
    # Admin - Analytics
    path('admin/analytics/', admin_get_analytics, name='admin-analytics'),
    
    # Router (this goes last)
    path('', include(router.urls)),
]  