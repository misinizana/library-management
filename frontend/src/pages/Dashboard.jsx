import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBooks, createBook, updateBook, deleteBook, searchBooksExternal } from '../services/api';
import Navbar from '../components/Navbar';

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
        cover_image: '',
        description: '',
        page_count: '',
    });

    // Search state
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

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
            setFormData({ 
                title: '', 
                author: '', 
                genre: 'fiction', 
                status: 'to_read',
                cover_image: '',
                description: '',
                page_count: '',
            });
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
            cover_image: book.cover_image || '',
            description: book.description || '',
            page_count: book.page_count || '',
        });
        setShowForm(true);
        setShowSearch(false);
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
        setShowSearch(false);
        setEditingBook(null);
        setFormData({ 
            title: '', 
            author: '', 
            genre: 'fiction', 
            status: 'to_read',
            cover_image: '',
            description: '',
            page_count: '',
        });
        setSearchResults([]);
        setSearchQuery('');
    };

    // Search Google Books
    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!searchQuery.trim()) return;
        
        try {
            setSearching(true);
            const data = await searchBooksExternal(searchQuery);
            setSearchResults(data.results || []);
        } catch (err) {
            setError('Failed to search books');
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    // Select book from search results
    const handleSelectBook = (book) => {
        setFormData({
            title: book.title,
            author: book.author,
            genre: 'fiction', // Default, user can change
            status: 'to_read',
            cover_image: book.cover_image,
            description: book.description,
            page_count: book.page_count || '',
        });
        setShowSearch(false);
        setShowForm(true);
        setSearchResults([]);
        setSearchQuery('');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <Navbar />
            
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1>My Library</h1>

                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                {/* Action Buttons */}
                {!showForm && !showSearch && (
                    <div style={{ marginBottom: '20px' }}>
                        <button 
                            onClick={() => setShowSearch(true)}
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                border: 'none',
                                marginRight: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            🔍 Search Books Online
                        </button>
                        <button 
                            onClick={() => setShowForm(true)}
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#28a745', 
                                color: 'white', 
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            ➕ Add Book Manually
                        </button>
                    </div>
                )}

                {/* Search Books Section */}
                {showSearch && (
                    <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px' }}>
                        <h3>Search Books Online</h3>
                        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, author, or ISBN..."
                                style={{ width: '70%', padding: '10px', marginRight: '10px' }}
                            />
                            <button 
                                type="submit"
                                disabled={searching}
                                style={{ 
                                    padding: '10px 20px', 
                                    backgroundColor: '#007bff', 
                                    color: 'white', 
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                {searching ? 'Searching...' : 'Search'}
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

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div>
                                <h4>Results ({searchResults.length})</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                    {searchResults.map((book, index) => (
                                        <div 
                                            key={index}
                                            onClick={() => handleSelectBook(book)}
                                            style={{ 
                                                border: '1px solid #ddd', 
                                                padding: '10px', 
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {book.cover_image && (
                                                <img 
                                                    src={book.cover_image} 
                                                    alt={book.title}
                                                    style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '10px' }}
                                                />
                                            )}
                                            <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>{book.title}</h4>
                                            <p style={{ fontSize: '12px', color: '#666' }}>{book.author}</p>
                                            {book.page_count > 0 && (
                                                <p style={{ fontSize: '11px', color: '#999' }}>{book.page_count} pages</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchResults.length === 0 && searchQuery && !searching && (
                            <p>No results found. Try a different search term.</p>
                        )}
                    </div>
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

                            <div style={{ marginBottom: '10px' }}>
                                <label>Cover Image URL (optional):</label>
                                <input
                                    type="url"
                                    name="cover_image"
                                    value={formData.cover_image}
                                    onChange={handleChange}
                                    placeholder="https://example.com/cover.jpg"
                                    style={{ width: '100%', padding: '8px' }}
                                />
                                {formData.cover_image && (
                                    <img 
                                        src={formData.cover_image} 
                                        alt="Preview"
                                        style={{ width: '100px', marginTop: '10px' }}
                                    />
                                )}
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label>Description (optional):</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    style={{ width: '100%', padding: '8px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label>Page Count (optional):</label>
                                <input
                                    type="number"
                                    name="page_count"
                                    value={formData.page_count}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '8px' }}
                                />
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
                    <p>No books yet. Search for books online or add one manually!</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {books.map((book) => (
                            <div 
                                key={book.id} 
                                style={{ 
                                    border: '1px solid #ddd', 
                                    padding: '15px', 
                                    borderRadius: '5px' 
                                }}
                            >
                                {book.cover_image && (
                                    <img 
                                        src={book.cover_image} 
                                        alt={book.title}
                                        style={{ width: '100%', height: '300px', objectFit: 'cover', marginBottom: '10px' }}
                                    />
                                )}
                                <h3>{book.title}</h3>
                                <p><strong>Author:</strong> {book.author}</p>
                                <p><strong>Genre:</strong> {book.genre}</p>
                                <p><strong>Status:</strong> {book.status}</p>
                                {book.page_count && <p><strong>Pages:</strong> {book.page_count}</p>}
                                
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
        </div>
    );
};

export default Dashboard;