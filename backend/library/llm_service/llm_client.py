import requests
import os
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()  


def call_openrouter(messages, model="openai/gpt-4o-mini", temperature=0.1):
    """
    Call OpenRouter API with given messages
    
    Args:
        messages: List of message dicts [{"role": "system/user", "content": "..."}]
        model: Model identifier (default: gpt-3.5-turbo)
        temperature: Creativity level 0-1 (lower = more deterministic)
    
    Returns:
        str: LLM response content
    
    Raises:
        Exception: If API call fails
    """
    
    # Get API key from environment
    api_key = os.getenv('OPENROUTER_API_KEY')
    
    if not api_key:
        raise Exception("OPENROUTER_API_KEY not found in environment variables")
    
    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": temperature
            },
            timeout=30
        )
        
        response.raise_for_status()
        
        data = response.json()
        return data['choices'][0]['message']['content']
        
    except requests.exceptions.Timeout:
        raise Exception("OpenRouter API request timed out")
    except requests.exceptions.RequestException as e:
        raise Exception(f"OpenRouter API request failed: {str(e)}")
    except (KeyError, IndexError) as e:
        raise Exception(f"Unexpected API response format: {str(e)}")