"""
SQL Service
Handles SQL generation, validation, and execution with conversation context
"""

import re
from django.db import connection
from .llm_client import call_openrouter
from .prompts import (
    get_sql_generation_prompt_for_user,
    get_sql_generation_prompt_for_admin,
    get_result_formatting_prompt
)


def generate_sql_query(question, user, conversation_history=None):
    """
    Generate SQL query from natural language question using LLM with conversation context
    
    Args:
        question: Natural language question from user
        user: Django User object (has id and is_admin attributes)
        conversation_history: List of previous messages for context (optional)
    
    Returns:
        str: Generated SQL query
    """
    # Get appropriate prompt based on user role
    if user.is_admin:
        system_prompt = get_sql_generation_prompt_for_admin(user.id)
    else:
        system_prompt = get_sql_generation_prompt_for_user(user.id)
    
    # Build messages array
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history if provided
    if conversation_history:
        # Add all previous messages except the last one (which is the current question)
        for msg in conversation_history[:-1]:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })
    
    # Add current question
    messages.append({
        "role": "user",
        "content": f"Question: {question}\n\nGenerate SQL query:"
    })
    
    # Call LLM
    response = call_openrouter(messages, temperature=0.1)
    
    # Extract SQL from response
    sql = extract_sql_from_response(response)
    
    return sql


def extract_sql_from_response(response):
    """
    Extract SQL query from LLM response
    Handles markdown code blocks and plain text
    
    Args:
        response: Raw LLM response text
    
    Returns:
        str: Cleaned SQL query
    """
    # Try to find SQL between ```sql and ```
    match = re.search(r'```sql\s*(.*?)\s*```', response, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # Try to find SQL between ``` and ```
    match = re.search(r'```\s*(.*?)\s*```', response, re.DOTALL)
    if match:
        return match.group(1).strip()
    
    # Otherwise return the whole response cleaned
    return response.strip()


def validate_sql_query(sql, user):
    """
    Validate SQL query for security and correctness
    
    Args:
        sql: SQL query string to validate
        user: Django User object
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    sql_upper = sql.upper()
    sql_lower = sql.lower()
    
    # 1. Must be a SELECT query
    if not sql_upper.strip().startswith('SELECT'):
        return False, "Only SELECT queries are allowed"
    
    # 2. Block dangerous keywords (but allow them in column names like created_at)
    # Check for dangerous keywords as standalone words using word boundaries
    dangerous_patterns = [
        r'\bDROP\b',
        r'\bDELETE\b', 
        r'\bUPDATE\b',
        r'\bINSERT\b',
        r'\bALTER\b',
        r'\bTRUNCATE\b',
        r'\bEXEC\b',
        r'\bEXECUTE\b',
        r'\bGRANT\b',
        r'\bREVOKE\b',
        r'INTO OUTFILE',
        r'LOAD_FILE'
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, sql_upper):
            return False, f"Dangerous SQL operation detected"
    
    # 3. For non-admin users, validate user_id filter
    if not user.is_admin:
        # Check if query involves library_book table
        if 'library_book' in sql_lower or re.search(r'\bbook\b', sql_lower):
            # Must have user_id filter
            user_id_patterns = [
                f'user_id = {user.id}',
                f'user_id={user.id}',
                f'user_id= {user.id}',
                f'user_id ={user.id}',
                f'b.user_id = {user.id}',
                f'b.user_id={user.id}',
                f'book.user_id = {user.id}',
                f'book.user_id={user.id}',
                f'library_book.user_id = {user.id}',
                f'library_book.user_id={user.id}',
            ]
            
            has_filter = any(pattern.lower() in sql_lower for pattern in user_id_patterns)
            
            if not has_filter:
                return False, f"Security: Query must include 'WHERE user_id = {user.id}' to access only your books"
        
        # Users cannot query library_user table (except through JOINs with their books)
        if 'library_user' in sql_lower and 'library_book' not in sql_lower:
            return False, "You cannot directly query user information"
    
    # 4. Check for basic SQL injection patterns
    injection_patterns = [
        r';\s*DROP',
        r';\s*DELETE',
        r';\s*UPDATE',
        r'--',
        r'/\*',
        r'\*/',
        r'xp_',
        r'sp_',
    ]
    
    for pattern in injection_patterns:
        if re.search(pattern, sql, re.IGNORECASE):
            return False, "Invalid SQL syntax detected"
    
    # All checks passed
    return True, None

def execute_sql_query(sql):
    """
    Execute SQL query safely and return results
    
    Args:
        sql: Validated SQL query string
    
    Returns:
        list: List of dictionaries with query results
    
    Raises:
        Exception: If query execution fails
    """
    from decimal import Decimal  # ADD THIS IMPORT
    
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            
            # Get column names
            columns = [col[0] for col in cursor.description] if cursor.description else []
            
            # Fetch all results
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            results = []
            for row in rows:
                result_dict = {}
                for i, column in enumerate(columns):
                    value = row[i]
                    
                    # Convert datetime objects to strings
                    if hasattr(value, 'isoformat'):
                        value = value.isoformat()
                    # Convert Decimal to float - ADD THIS
                    elif isinstance(value, Decimal):
                        value = float(value)
                    
                    result_dict[column] = value
                results.append(result_dict)
            
            return results
            
    except Exception as e:
        raise Exception(f"SQL execution error: {str(e)}")
    
    

def format_results_with_llm(question, sql, results, conversation_history=None):
    """
    Format SQL results into natural language using LLM with conversation context
    
    Args:
        question: Original user question
        sql: SQL query that was executed
        results: Query results (list of dicts)
        conversation_history: Previous conversation messages for context
    
    Returns:
        str: Natural language formatted answer
    """
    if not results:
        return "Seems like there was no results for your specific question. Do you want to know anything else?"
    
    system_prompt = get_result_formatting_prompt()
    
    # Build messages for formatting
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation context if available (last 3 exchanges for brevity)
    if conversation_history and len(conversation_history) > 2:
        context_messages = conversation_history[-6:-1]  # Last 3 Q&A pairs, exclude current question
        for msg in context_messages:
            messages.append({
                "role": msg.get("role"),
                "content": msg.get("content")
            })
    
    # Add current question and results
    user_message = f"""
Question: {question}

SQL Query: {sql}

Results: {results}

Provide a clear, natural language answer based on these results.
"""
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = call_openrouter(messages, temperature=0.3)
        return response
    except Exception as e:
        # Fallback if LLM fails
        return f"Query executed successfully. Found {len(results)} result(s)."


def process_query(question, user):
    """
    Complete query processing pipeline (backward compatibility - no context)
    
    Args:
        question: Natural language question
        user: Django User object
    
    Returns:
        dict: {
            "success": bool,
            "sql": str,
            "results": list or None,
            "answer": str or None,
            "error": str or None
        }
    """
    return process_query_with_context([{"role": "user", "content": question}], user)


def process_query_with_context(conversation, user):
    """
    Complete query processing pipeline with conversation context
    Generates, validates, executes SQL query, and formats results
    
    Args:
        conversation: List of conversation messages [{"role": "user/assistant", "content": "..."}]
        user: Django User object
    
    Returns:
        dict: {
            "success": bool,
            "sql": str,
            "results": list or None,
            "answer": str or None,
            "error": str or None
        }
    """
    try:
        # Get the latest question
        latest_question = conversation[-1].get('content', '') if conversation else ''
        
        if not latest_question:
            return {
                "success": False,
                "sql": None,
                "results": None,
                "answer": None,
                "error": "No question provided"
            }
        
        # Step 1: Generate SQL with conversation context
        sql = generate_sql_query(latest_question, user, conversation)
        
        # Step 2: Validate SQL
        is_valid, error_message = validate_sql_query(sql, user)
        
        if not is_valid:
            return {
                "success": False,
                "sql": sql,
                "results": None,
                "answer": None,
                "error": error_message
            }
        
        # Step 3: Execute SQL
        results = execute_sql_query(sql)
        
        # Step 4: Format results with LLM (with conversation context)
        answer = format_results_with_llm(latest_question, sql, results, conversation)
        
        return {
            "success": True,
            "sql": sql,
            "results": results,
            "answer": answer,
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "sql": None,
            "results": None,
            "answer": None,
            "error": str(e)
        }