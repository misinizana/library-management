import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBooks, createBook, updateBook, deleteBook } from '../services/api';

const Dashboard = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        genre: 'fiction',
        status: 'to_read',
    });

    const { user, logout } = useAuth();

    // Fetch books on mount
    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            setLoading(true);
            const data = await getBooks();
            setBooks(data);
            setError('');
        } catch (err) {
            setError('Failed to load books');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingBook) {
                await updateBook(editingBook.id, formData);
            } else {
                await createBook(formData);
            }
            
            // Reset form and refresh books
            setFormData({ title: '', author: '', genre: 'fiction', status: 'to_read' });
            setShowForm(false);
            setEditingBook(null);
            fetchBooks();
        } catch (err) {
            setError('Failed to save book');
            console.error(err);
        }
    };

    const handleEdit = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            genre: book.genre,
            status: book.status,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await deleteBook(id);
                fetchBooks();
            } catch (err) {
                setError('Failed to delete book');
                console.error(err);
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingBook(null);
        setFormData({ title: '', author: '', genre: 'fiction', status: 'to_read' });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>My Library</h1>
                <div>
                    <span style={{ marginRight: '20px' }}>Welcome, {user?.username}!</span>
                    {user?.is_admin && (
                        <button 
                            onClick={() => window.location.href = '/admin'}
                            style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
                        >
                            Admin Dashboard
                        </button>
                    )}
                    <button onClick={logout}>Logout</button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Add Book Button */}
            {!showForm && (
                <button 
                    onClick={() => setShowForm(true)}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none',
                        marginBottom: '20px',
                        cursor: 'pointer'
                    }}
                >
                    Add New Book
                </button>
            )}

            {/* Add/Edit Book Form */}
            {showForm && (
                <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
                    <h3>{editingBook ? 'Edit Book' : 'Add New Book'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '10px' }}>
                            <label>Title:</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label>Author:</label>
                            <input
                                type="text"
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                required
                                style={{ width: '100%', padding: '8px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label>Genre:</label>
                            <select
                                name="genre"
                                value={formData.genre}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="fiction">Fiction</option>
                                <option value="non_fiction">Non-Fiction</option>
                                <option value="mystery">Mystery</option>
                                <option value="sci_fi">Science Fiction</option>
                                <option value="fantasy">Fantasy</option>
                                <option value="biography">Biography</option>
                                <option value="history">History</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                            <label>Status:</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px' }}
                            >
                                <option value="to_read">To Read</option>
                                <option value="reading">Reading</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <button 
                            type="submit"
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                border: 'none',
                                marginRight: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            {editingBook ? 'Update' : 'Add'} Book
                        </button>
                        <button 
                            type="button"
                            onClick={handleCancel}
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#6c757d', 
                                color: 'white', 
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {/* Books List */}
            <h2>My Books ({books.length})</h2>
            
            {books.length === 0 ? (
                <p>No books yet. Add your first book!</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {books.map((book) => (
                        <div 
                            key={book.id} 
                            style={{ 
                                border: '1px solid #ddd', 
                                padding: '15px', 
                                borderRadius: '5px' 
                            }}
                        >
                            <h3>{book.title}</h3>
                            <p><strong>Author:</strong> {book.author}</p>
                            <p><strong>Genre:</strong> {book.genre}</p>
                            <p><strong>Status:</strong> {book.status}</p>
                            
                            <div style={{ marginTop: '10px' }}>
                                <button 
                                    onClick={() => handleEdit(book)}
                                    style={{ 
                                        padding: '5px 10px', 
                                        backgroundColor: '#ffc107', 
                                        border: 'none',
                                        marginRight: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(book.id)}
                                    style={{ 
                                        padding: '5px 10px', 
                                        backgroundColor: '#dc3545', 
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;