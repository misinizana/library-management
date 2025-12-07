"""
Recommendation Service
Generates AI-powered book recommendations based on user's reading history
"""

import json
import re
import requests
from datetime import timedelta
from django.utils import timezone
from ..models import Book
from .llm_client import call_openrouter
from .prompts import get_recommendation_prompt


def get_recent_books(user, days=30):
    """
    Get user's recent books for recommendation analysis
    
    Args:
        user: Django User object
        days: Number of days to look back (default 30)
    
    Returns:
        list: List of book dictionaries with title, author, genre, status
    """
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Get books user has been reading or completed recently
    recent_books = Book.objects.filter(
        user=user,
        status__in=['reading', 'completed'],
        updated_at__gte=cutoff_date
    ).order_by('-updated_at')
    
    # If no recent activity, get last 10 books regardless of date
    if not recent_books.exists():
        recent_books = Book.objects.filter(
            user=user,
            status__in=['reading', 'completed']
        ).order_by('-updated_at')[:10]
    
    # Convert to list of dicts for LLM
    books_data = []
    for book in recent_books:
        books_data.append({
            'title': book.title,
            'author': book.author,
            'genre': book.genre,
            'status': book.status
        })
    
    return books_data


def extract_json_from_response(response):
    """
    Extract JSON array from LLM response
    Handles markdown code blocks and extra text
    
    Args:
        response: Raw LLM response text
    
    Returns:
        list: Parsed JSON array
    """
    # Try to find JSON between ```json and ```
    match = re.search(r'```json\s*(.*?)\s*```', response, re.DOTALL | re.IGNORECASE)
    if match:
        return json.loads(match.group(1).strip())
    
    # Try to find JSON between ``` and ```
    match = re.search(r'```\s*(.*?)\s*```', response, re.DOTALL)
    if match:
        return json.loads(match.group(1).strip())
    
    # Try to find JSON array directly
    match = re.search(r'\[.*\]', response, re.DOTALL)
    if match:
        return json.loads(match.group(0).strip())
    
    # Otherwise try to parse the whole response
    return json.loads(response.strip())


def search_google_books(query, max_results=3):
    """
    Search Google Books API for books matching the query
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
    
    Returns:
        list: List of book dictionaries
    """
    try:
        url = f'https://www.googleapis.com/books/v1/volumes?q={query}&maxResults={max_results}'
        response = requests.get(url, verify=False, timeout=10)
        data = response.json()
        
        books = []
        for item in data.get('items', []):
            volume_info = item.get('volumeInfo', {})
            
            book = {
                'google_id': item.get('id'),
                'title': volume_info.get('title', 'Unknown Title'),
                'author': ', '.join(volume_info.get('authors', ['Unknown Author'])),
                'description': volume_info.get('description', ''),
                'cover_image': volume_info.get('imageLinks', {}).get('thumbnail', ''),
                'published_date': volume_info.get('publishedDate', ''),
                'page_count': volume_info.get('pageCount', 0),
                'categories': volume_info.get('categories', []),
            }
            books.append(book)
        
        return books
        
    except Exception as e:
        print(f"Error searching Google Books: {str(e)}")
        return []


def generate_recommendations(user):
    """
    Generate AI-powered book recommendations for a user
    
    Args:
        user: Django User object
    
    Returns:
        dict: {
            "success": bool,
            "recommendations": list of recommendation objects,
            "error": str or None
        }
    """
    try:
        # Step 1: Get user's recent reading history
        recent_books = get_recent_books(user)
        

        # Step 2: Generate recommendation prompts using LLM
        prompt = get_recommendation_prompt(recent_books)
        
        messages = [
            {"role": "system", "content": "You are a book recommendation expert. Always return valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = call_openrouter(messages, temperature=0.7)  # Higher temp for creativity
        
        # Step 3: Parse LLM response
        suggestions = extract_json_from_response(response)
        
        # Step 4: Search Google Books for each suggestion
        recommendations = []
        user_book_titles = set(
            Book.objects.filter(user=user).values_list('title', flat=True)
        )
        
        for suggestion in suggestions[:5]:  # Limit to 5 recommendations
            search_query = suggestion.get('search_query', '')
            ai_reason = suggestion.get('reason', '')
            expected_genre = suggestion.get('expected_genre', '')
            
            # Search Google Books
            books = search_google_books(search_query, max_results=3)
            
            # Find first book that user doesn't already own
            for book in books:
                if book['title'] not in user_book_titles:
                    recommendations.append({
                        'book': book,
                        'ai_reason': ai_reason,
                        'expected_genre': expected_genre,
                        'search_query': search_query
                    })
                    break
        
        return {
            "success": True,
            "recommendations": recommendations,
            "error": None
        }
        
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "recommendations": [],
            "error": f"Failed to parse AI response: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "recommendations": [],
            "error": f"Recommendation generation failed: {str(e)}"
        }