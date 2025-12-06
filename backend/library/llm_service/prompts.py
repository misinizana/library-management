"""
LLM Prompts for AI Query System
"""

def get_database_schema():
    """Returns the database schema description for MySQL"""
    return """
Database: MySQL

Table: library_user
- id (INT, PRIMARY KEY)
- username (VARCHAR)
- email (VARCHAR)
- is_admin (TINYINT: 0 or 1)
- date_joined (DATETIME)

Table: library_book
- id (INT, PRIMARY KEY)
- title (VARCHAR)
- author (VARCHAR)
- genre (VARCHAR): fiction, non_fiction, mystery, sci_fi, fantasy, biography, history, other
- status (VARCHAR): to_read, reading, completed
- user_id (INT, FOREIGN KEY -> library_user.id)
- page_count (INT)
- created_at (DATETIME)
- updated_at (DATETIME)

Relationship: library_book.user_id references library_user.id (one user has many books)
"""


def get_sql_generation_prompt_for_user(user_id):
    """System prompt for regular users - restricted to their own data"""
    schema = get_database_schema()
    
    return f"""You are a SQL query generator for a library system.

User ID: {user_id}
CRITICAL: This user can ONLY access their own books. You MUST include "WHERE user_id = {user_id}" in ALL queries involving library_book.

{schema}

Generate ONLY a SELECT SQL query. No explanations. MySQL syntax."""


def get_sql_generation_prompt_for_admin():
    """System prompt for admin users - full access to all data"""
    schema = get_database_schema()
    
    return f"""You are a SQL query generator for a library system.

User Role: ADMIN (full access to all data)

{schema}

Generate ONLY a SELECT SQL query. No explanations. MySQL syntax."""


def get_result_formatting_prompt():
    """System prompt for formatting results into natural language"""
    return """Convert database query results into a clear, concise natural language answer.
Be direct and friendly. Format lists when appropriate."""