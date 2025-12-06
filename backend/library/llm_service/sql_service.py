import re
from django.db import connection
from .llm_client import call_openrouter
from .prompts import (
    get_sql_generation_prompt_for_user,
    get_sql_generation_prompt_for_admin,
    get_result_formatting_prompt
)


def generate_sql_query(question, user):
    """
    Generate SQL query from natural language question using LLM
    
    Args:
        question: Natural language question from user
        user: Django User object (has id and is_admin attributes)
    
    Returns:
        str: Generated SQL query
    """
    if user.is_admin:
        system_prompt = get_sql_generation_prompt_for_admin()
    else:
        system_prompt = get_sql_generation_prompt_for_user(user.id)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Question: {question}\n\nGenerate SQL query:"}
    ]
    
    response = call_openrouter(messages, temperature=0.1)
    
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
    
    # 2. Block dangerous keywords
    dangerous_keywords = [
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 
        'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE', 
        'GRANT', 'REVOKE', 'INTO OUTFILE', 'LOAD_FILE'
    ]
    
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            return False, f"Dangerous keyword '{keyword}' is not allowed"
    
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
    
    return True, None


def execute_sql_query(sql):
    """
    Execute SQL query safely and return results
    
    Args:
        sql: Validated SQL query string
    
    Returns:
        list: List of dictionaries with query results
              [{"column1": value1, "column2": value2}, ...]
    
    Raises:
        Exception: If query execution fails
    """
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
                    # Convert datetime objects to strings for JSON serialization
                    value = row[i]
                    if hasattr(value, 'isoformat'):  # datetime object
                        value = value.isoformat()
                    result_dict[column] = value
                results.append(result_dict)
            
            return results
            
    except Exception as e:
        raise Exception(f"SQL execution error: {str(e)}")


def process_query(question, user):
    """
    Complete query processing pipeline
    Generates, validates, executes SQL query, and formats results
    
    Args:
        question: Natural language question
        user: Django User object
    
    Returns:
        dict: {
            "success": bool,
            "sql": str,
            "results": list or None,
            "answer": str or None,  # NEW: formatted answer
            "error": str or None
        }
    """
    try:
        # Step 1: Generate SQL
        sql = generate_sql_query(question, user)
        
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
        
        # Step 4: Format results with LLM
        answer = format_results_with_llm(question, sql, results)
        
        return {
            "success": True,
            "sql": sql,
            "results": results,
            "answer": answer,  # Natural language answer
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
    


def format_results_with_llm(question, sql, results):
    """
    Format SQL results into natural language using LLM
    
    Args:
        question: Original user question
        sql: SQL query that was executed
        results: Query results (list of dicts)
    
    Returns:
        str: Natural language formatted answer
    """
    if not results:
        return "No results found for your query."
    
    system_prompt = get_result_formatting_prompt()
    
    user_message = f"""
Question: {question}

SQL Query: {sql}

Results: {results}

Provide a clear, natural language answer based on these results.
"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    try:
        response = call_openrouter(messages, temperature=0.3)
        return response
    except Exception as e:
        # Fallback if LLM fails
        return f"Query executed successfully. Found {len(results)} result(s)."