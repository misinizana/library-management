import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiQuery } from '../services/api';

const AiChat = () => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const { user } = useAuth();

    const exampleQuestions = user?.is_admin ? [
        "Who owns the most books?",
        "What's the most popular book?",
        "How many users are registered?",
        "Which genre is most popular?",
        "How many users have zero books?",
    ] : [
        "How many books do I have?",
        "Show me all my books",
        "What books am I currently reading?",
        "What's my favorite genre?",
        "List my completed books",
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!question.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await aiQuery(question);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to process query. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExampleClick = (exampleQuestion) => {
        setQuestion(exampleQuestion);
    };

    const handleAskAnother = () => {
        setQuestion('');
        setResult(null);
        setError('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
                <h1>🤖 AI Assistant</h1>
                <p style={{ color: '#666' }}>
                    Ask me anything about {user?.is_admin ? 'the library system' : 'your library'}!
                </p>
            </div>

            {/* Example Questions */}
            {!result && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                    <h3 style={{ marginTop: 0 }}>💡 Try asking:</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {exampleQuestions.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => handleExampleClick(example)}
                                style={{
                                    padding: '10px 15px',
                                    backgroundColor: 'white',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#e9ecef';
                                    e.target.style.borderColor = '#007bff';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'white';
                                    e.target.style.borderColor = '#ddd';
                                }}
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Question Input */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Type your question here..."
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '15px',
                            fontSize: '16px',
                            border: '2px solid #ddd',
                            borderRadius: '5px',
                            outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                    <button
                        type="submit"
                        disabled={loading || !question.trim()}
                        style={{
                            padding: '15px 30px',
                            fontSize: '16px',
                            backgroundColor: loading ? '#6c757d' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {loading ? 'Processing...' : 'Ask AI 🔍'}
                    </button>
                </div>
            </form>

            {/* Error Display */}
            {error && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '5px',
                    marginBottom: '20px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Results Display */}
            {result && (
                <div>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#007bff' }}>Question:</h3>
                        <p style={{ 
                            padding: '15px', 
                            backgroundColor: '#e7f3ff', 
                            borderRadius: '5px',
                            fontSize: '16px'
                        }}>
                            {result.question}
                        </p>
                    </div>

                    {/* Answer */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3>📊 Answer:</h3>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '5px',
                            fontSize: '16px',
                            lineHeight: '1.6'
                        }}>
                            {result.answer}
                        </div>
                    </div>

                    {/* SQL Query */}
                    <div style={{ marginBottom: '20px' }}>
                        <h3>💻 SQL Query Used:</h3>
                        <pre style={{
                            padding: '15px',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4',
                            borderRadius: '5px',
                            overflow: 'auto',
                            fontSize: '14px'
                        }}>
                            {result.sql}
                        </pre>
                    </div>

                    {/* Raw Results Table */}
                    {result.results && result.results.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3>📋 Raw Results:</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    backgroundColor: 'white'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                                            {Object.keys(result.results[0]).map((key) => (
                                                <th key={key} style={{ 
                                                    padding: '12px', 
                                                    textAlign: 'left',
                                                    border: '1px solid #ddd'
                                                }}>
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.results.map((row, index) => (
                                            <tr key={index} style={{ 
                                                backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' 
                                            }}>
                                                {Object.values(row).map((value, i) => (
                                                    <td key={i} style={{ 
                                                        padding: '12px',
                                                        border: '1px solid #ddd'
                                                    }}>
                                                        {value !== null && value !== undefined ? String(value) : 'NULL'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Ask Another Button */}
                    <button
                        onClick={handleAskAnother}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold'
                        }}
                    >
                        Ask Another Question 🔄
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiChat;