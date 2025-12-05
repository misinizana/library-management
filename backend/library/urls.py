from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookViewSet,
    admin_get_all_books,
    admin_delete_book,
    admin_get_all_users,
    admin_delete_user
)

router = DefaultRouter()
router.register(r'books', BookViewSet, basename='book')

urlpatterns = [
    path('', include(router.urls)),
    # Admin endpoints
    path('admin/books/', admin_get_all_books, name='admin-books'),
    path('admin/books/<int:pk>/', admin_delete_book, name='admin-delete-book'),
    path('admin/users/', admin_get_all_users, name='admin-users'),
    path('admin/users/<int:pk>/', admin_delete_user, name='admin-delete-user'),
]