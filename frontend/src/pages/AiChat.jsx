import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    getConversations, 
    createConversation, 
    getConversation, 
    deleteConversation, 
    sendMessage, 
    clearAllConversations 
} from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';

const AiChat = () => {
    // Sidebar state
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    
    // Active conversation state
    const [currentMessages, setCurrentMessages] = useState([]);
    const [question, setQuestion] = useState('');
    
    // Loading states
    const [loading, setLoading] = useState(false);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState('');

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

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

    // Load conversations on mount - but DON'T auto-select
    useEffect(() => {
        loadConversations();
    }, []);

    // Helper functions
    const isListingData = (results) => {
        if (!results || results.length === 0) return false;
        return results.length > 1 || Object.keys(results[0]).length > 2;
    };

    const formatColumnName = (name) => {
        return name
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    const formatCellValue = (key, value) => {
        if (value === null || value === undefined) return '—';
        
        if (key.toLowerCase().includes('email')) {
            return <span style={{ color: '#007bff' }}>{value}</span>;
        }
        
        if (key.toLowerCase().includes('status') || key.toLowerCase().includes('genre')) {
            const colors = {
                'completed': '#28a745',
                'reading': '#007bff',
                'to_read': '#ffc107',
                'fiction': '#6f42c1',
                'non_fiction': '#20c997',
                'mystery': '#fd7e14',
                'sci_fi': '#17a2b8',
                'fantasy': '#e83e8c'
            };
            const color = colors[value.toLowerCase()] || '#6c757d';
            return (
                <span style={{ 
                    backgroundColor: color + '20',
                    color: color,
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500'
                }}>
                    {value}
                </span>
            );
        }
        
        if (typeof value === 'number') {
            return <strong>{value.toLocaleString()}</strong>;
        }
        
        return String(value);
    };

    const formatTextWithMarkdown = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const boldText = part.slice(2, -2);
                return <strong key={idx}>{boldText}</strong>;
            }
            return <span key={idx}>{part}</span>;
        });
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    // Load all conversations (don't auto-select)
    const loadConversations = async () => {
        try {
            setLoadingConversations(true);
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoadingConversations(false);
        }
    };

    // Create new conversation
    const handleNewConversation = async () => {
        try {
            setLoading(true);
            const newConv = await createConversation();
            setConversations([newConv, ...conversations]);
            setActiveConversationId(newConv.id);
            setCurrentMessages([]);
            setQuestion('');
            setError('');
        } catch (err) {
            setError('Failed to create conversation');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Select and load a conversation
    const selectConversation = async (id) => {
        try {
            setLoading(true);
            const conv = await getConversation(id);
            setActiveConversationId(id);
            setCurrentMessages(conv.messages || []);
            setError('');
        } catch (err) {
            setError('Failed to load conversation');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Send message
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!question.trim()) return;
        
        if (!activeConversationId) {
            // Create new conversation first
            try {
                const newConv = await createConversation();
                setConversations(prev => [newConv, ...prev]);
                setActiveConversationId(newConv.id);
                setCurrentMessages([]);
                setError('');
                
                // Now send the message
                await handleSubmitMessage(newConv.id);
            } catch (err) {
                setError('Failed to create conversation');
                console.error(err);
            }
            return;
        }

        await handleSubmitMessage(activeConversationId);
    };

    const handleSubmitMessage = async (conversationId) => {
        const userQuestion = question.trim();
        
        try {
            setSendingMessage(true);
            setError('');
            
            // Clear input immediately
            setQuestion('');

            // Optimistically add user message to UI
            const userMsg = {
                role: 'user',
                content: userQuestion,
                created_at: new Date().toISOString()
            };
            setCurrentMessages(prev => [...prev, userMsg]);

            // Send to backend
            const assistantMsg = await sendMessage(conversationId, userQuestion);
            
            // Add assistant response using functional update
            setCurrentMessages(prev => [...prev, assistantMsg]);
            
            // Reload conversations list to update title and timestamp
            await loadConversations();
            
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send message');
            console.error(err);
            // Restore question on error
            setQuestion(userQuestion);
            // Remove optimistic user message on error
            setCurrentMessages(prev => prev.slice(0, -1));
        } finally {
            setSendingMessage(false);
        }
    };

    // Delete conversation
    const handleDeleteConversation = async (id, e) => {
        e.stopPropagation();
        
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Conversation?',
            message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
            onConfirm: async () => {
                try {
                    await deleteConversation(id);
                    setConversations(prev => prev.filter(c => c.id !== id));
                    
                    if (activeConversationId === id) {
                        setActiveConversationId(null);
                        setCurrentMessages([]);
                    }
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (err) {
                    setError('Failed to delete conversation');
                    console.error(err);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    // Clear all conversations
    const handleClearAll = async () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Clear All Conversations?',
            message: 'Are you sure you want to delete all conversations? This action cannot be undone and will permanently remove all your chat history.',
            onConfirm: async () => {
                try {
                    await clearAllConversations();
                    setConversations([]);
                    setActiveConversationId(null);
                    setCurrentMessages([]);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (err) {
                    setError('Failed to clear conversations');
                    console.error(err);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    const handleExampleClick = async (exampleQuestion) => {
        setQuestion(exampleQuestion);
        // Auto-create conversation and send if no active conversation
        if (!activeConversationId) {
            try {
                const newConv = await createConversation();
                setConversations(prev => [newConv, ...prev]);
                setActiveConversationId(newConv.id);
                setCurrentMessages([]);
                setError('');
            } catch (err) {
                setError('Failed to create conversation');
                console.error(err);
            }
        }
    };

    return (
        <div>
            <Navbar />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />
            
            <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
                {/* Sidebar */}
                <div style={{
                    width: '300px',
                    borderRight: '1px solid #ddd',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f8f9fa'
                }}>
                    {/* New Chat Button */}
                    <div style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
                        <button
                            onClick={handleNewConversation}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '16px'
                            }}
                        >
                            + New Chat
                        </button>
                    </div>

                    {/* Conversations List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {loadingConversations ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                Loading...
                            </p>
                        ) : conversations.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                                No conversations yet.<br />Start a new chat!
                            </p>
                        ) : (
                            conversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => selectConversation(conv.id)}
                                    style={{
                                        padding: '12px',
                                        marginBottom: '8px',
                                        backgroundColor: activeConversationId === conv.id ? '#e7f3ff' : 'white',
                                        border: activeConversationId === conv.id ? '2px solid #007bff' : '1px solid #ddd',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (activeConversationId !== conv.id) {
                                            e.currentTarget.style.backgroundColor = '#f0f0f0';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (activeConversationId !== conv.id) {
                                            e.currentTarget.style.backgroundColor = 'white';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, paddingRight: '10px', minWidth: 0 }}>
                                            <p style={{ 
                                                margin: '0 0 5px 0', 
                                                fontWeight: '500',
                                                fontSize: '14px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {conv.title}
                                            </p>
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: '12px', 
                                                color: '#666' ,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {formatTimestamp(conv.updated_at)} • {conv.message_count} msgs
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                                            style={{
                                                backgroundColor: 'transparent',
                                                border: 'none',
                                                color: '#dc3545',
                                                cursor: 'pointer',
                                                fontSize: '18px',
                                                padding: '0',
                                                width: '24px',
                                                height: '24px',
                                                flexShrink: 0
                                            }}
                                            title="Delete conversation"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Clear All Button */}
                    {conversations.length > 0 && (
                        <div style={{ padding: '15px', borderTop: '1px solid #ddd' }}>
                            <button
                                onClick={handleClearAll}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Chat Area */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column',
                    backgroundColor: 'white'
                }}>
                    {/* Messages Area */}
                    <div style={{ 
                        flex: 1, 
                        overflowY: 'auto', 
                        padding: '20px',
                        maxWidth: '900px',
                        margin: '0 auto',
                        width: '100%'
                    }}>
                        {!activeConversationId ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '60px 20px',
                                color: '#666'
                            }}>
                                <h2>   AI Assistant</h2>
                                <p>Ask me anything about {user?.is_admin ? 'the library system' : 'your library'}!</p>
                                
                                {/* Example Questions */}
                                <div style={{ marginTop: '40px', maxWidth: '600px', margin: '40px auto 0' }}>
                                    <h3>💡 Try asking:</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                        {exampleQuestions.map((example, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleExampleClick(example)}
                                                style={{
                                                    padding: '12px 20px',
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
                            </div>
                        ) : loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                <p>Loading conversation...</p>
                            </div>
                        ) : (
                            <div>
                                {currentMessages.map((msg, index) => (
                                    <div key={index} style={{ marginBottom: '20px' }}>
                                        {msg.role === 'user' ? (
                                            <div>
                                                <p style={{ 
                                                    fontWeight: 'bold', 
                                                    color: '#007bff',
                                                    marginBottom: '8px'
                                                }}>
                                                    You:
                                                </p>
                                                <div style={{
                                                    padding: '12px',
                                                    backgroundColor: '#e7f3ff',
                                                    borderRadius: '5px'
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                padding: '20px',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '5px',
                                                border: '1px solid #ddd'
                                            }}>
                                                <p style={{ 
                                                    fontWeight: 'bold', 
                                                    color: '#28a745',
                                                    marginBottom: '10px'
                                                }}>
                                                    AI:
                                                </p>
                                                <div style={{
                                                    padding: '15px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '5px',
                                                    lineHeight: '1.8'
                                                }}>
                                                    {msg.content.split('\n').map((line, idx) => {
                                                        if (line.match(/^\d+\./)) {
                                                            return (
                                                                <div key={idx} style={{ marginLeft: '20px', marginBottom: '8px' }}>
                                                                    {formatTextWithMarkdown(line)}
                                                                </div>
                                                            );
                                                        } else if (line.match(/^[-•*]\s/)) {
                                                            return (
                                                                <div key={idx} style={{ marginLeft: '20px', marginBottom: '8px' }}>
                                                                    {formatTextWithMarkdown(line)}
                                                                </div>
                                                            );
                                                        } else if (line.trim()) {
                                                            return (
                                                                <p key={idx} style={{ marginBottom: '10px' }}>
                                                                    {formatTextWithMarkdown(line)}
                                                                </p>
                                                            );
                                                        } else {
                                                            return <br key={idx} />;
                                                        }
                                                    })}
                                                </div>

                                                {/* Formatted Table */}
                                                {msg.results && msg.results.length > 0 && isListingData(msg.results) && (
                                                    <details style={{ marginTop: '15px' }}>
                                                        <summary style={{ 
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            color: '#666',
                                                            padding: '5px'
                                                        }}>
                                                            📊 View Formatted Table
                                                        </summary>
                                                        <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                                                            <table style={{ 
                                                                width: '100%', 
                                                                borderCollapse: 'collapse',
                                                                backgroundColor: 'white',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                            }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                                                        {Object.keys(msg.results[0]).map((key) => (
                                                                            <th key={key} style={{ 
                                                                                padding: '12px', 
                                                                                textAlign: 'left',
                                                                                borderBottom: '2px solid #ddd',
                                                                                fontWeight: '600'
                                                                            }}>
                                                                                {formatColumnName(key)}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {msg.results.map((row, rowIndex) => (
                                                                        <tr key={rowIndex} style={{ 
                                                                            backgroundColor: rowIndex % 2 === 0 ? '#f8f9fa' : 'white',
                                                                            borderBottom: '1px solid #e9ecef'
                                                                        }}>
                                                                            {Object.entries(row).map(([key, value], colIndex) => (
                                                                                <td key={colIndex} style={{ 
                                                                                    padding: '12px',
                                                                                    color: '#495057'
                                                                                }}>
                                                                                    {formatCellValue(key, value)}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </details>
                                                )}

                                                {/* SQL Query */}
                                                {msg.sql_query && (
                                                    <details style={{ marginTop: '10px' }}>
                                                        <summary style={{ 
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            color: '#666',
                                                            padding: '5px'
                                                        }}>
                                                            💻 View SQL Query
                                                        </summary>
                                                        <pre style={{
                                                            marginTop: '10px',
                                                            padding: '15px',
                                                            backgroundColor: '#1e1e1e',
                                                            color: '#d4d4d4',
                                                            borderRadius: '5px',
                                                            overflow: 'auto',
                                                            fontSize: '14px'
                                                        }}>
                                                            {msg.sql_query}
                                                        </pre>
                                                    </details>
                                                )}

                                                {/* Raw Results */}
                                                {msg.results && msg.results.length > 0 && (
                                                    <details style={{ marginTop: '10px' }}>
                                                        <summary style={{ 
                                                            cursor: 'pointer',
                                                            fontWeight: 'bold',
                                                            color: '#666',
                                                            padding: '5px'
                                                        }}>
                                                            📋 View Raw Data
                                                        </summary>
                                                        <div style={{ marginTop: '10px', overflowX: 'auto' }}>
                                                            <table style={{ 
                                                                width: '100%', 
                                                                borderCollapse: 'collapse',
                                                                backgroundColor: 'white'
                                                            }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                                                                        {Object.keys(msg.results[0]).map((key) => (
                                                                            <th key={key} style={{ 
                                                                                padding: '10px', 
                                                                                textAlign: 'left',
                                                                                border: '1px solid #ddd'
                                                                            }}>
                                                                                {key}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {msg.results.map((row, rowIndex) => (
                                                                        <tr key={rowIndex} style={{ 
                                                                            backgroundColor: rowIndex % 2 === 0 ? '#f8f9fa' : 'white' 
                                                                        }}>
                                                                            {Object.values(row).map((value, colIndex) => (
                                                                                <td key={colIndex} style={{ 
                                                                                    padding: '10px',
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
                                                    </details>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {sendingMessage && (
                                    <div style={{ 
                                        padding: '20px', 
                                        textAlign: 'center', 
                                        color: '#666',
                                        fontStyle: 'italic'
                                    }}>
                                        AI is thinking...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div style={{
                            padding: '15px',
                            margin: '0 20px',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '1px solid #f5c6cb',
                            borderRadius: '5px'
                        }}>
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Input Area */}
                    <div style={{
                        padding: '20px',
                        borderTop: '1px solid #ddd',
                        backgroundColor: 'white'
                    }}>
                        <form onSubmit={handleSubmit} style={{ maxWidth: '900px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder={activeConversationId ? "Ask a question..." : "Start a new conversation..."}
                                    disabled={sendingMessage}
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
                                    disabled={sendingMessage || !question.trim()}
                                    style={{
                                        padding: '15px 30px',
                                        fontSize: '16px',
                                        backgroundColor: sendingMessage ? '#6c757d' : '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: sendingMessage ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {sendingMessage ? 'Sending...' : 'Ask AI 🔍'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiChat;