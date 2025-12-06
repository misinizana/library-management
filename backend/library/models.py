from django.db import models
from django.contrib.auth.models import AbstractUser
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser

class User(AbstractUser):
    is_admin = models.BooleanField(default=False)
    
    def __str__(self):
        return self.username

class Book(models.Model):
    STATUS_CHOICES = [
        ('to_read', 'To Read'),
        ('reading', 'Reading'),
        ('completed', 'Completed'),
    ]
    
    GENRE_CHOICES = [
        ('fiction', 'Fiction'),
        ('non_fiction', 'Non-Fiction'),
        ('mystery', 'Mystery'),
        ('sci_fi', 'Science Fiction'),
        ('fantasy', 'Fantasy'),
        ('biography', 'Biography'),
        ('history', 'History'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    genre = models.CharField(max_length=50, choices=GENRE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='to_read')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='books')
    cover_image = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    page_count = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} by {self.author}"