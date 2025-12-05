import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    adminGetAllBooks, 
    adminGetAllUsers, 
    adminDeleteBook, 
    adminDeleteUser 
} from '../services/api';

const AdminDashboard = () => {
    const [books, setBooks] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('books'); // 'books' or 'users'

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            
            if (activeTab === 'books') {
                const data = await adminGetAllBooks();
                setBooks(data);
            } else {
                const data = await adminGetAllUsers();
                setUsers(data);
            }
        } catch (err) {
            setError('Failed to load data. You may not have admin permissions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBook = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await adminDeleteBook(id);
                fetchData();
            } catch (err) {
                setError('Failed to delete book');
                console.error(err);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This will also delete all their books.')) {
            try {
                await adminDeleteUser(id);
                fetchData();
            } catch (err) {
                setError('Failed to delete user');
                console.error(err);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h1>Admin Dashboard</h1>
                <div>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
                    >
                        My Library
                    </button>
                    <span style={{ marginRight: '20px' }}>Admin: {user?.username}</span>
                    <button onClick={logout}>Logout</button>
                </div>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Tabs */}
            <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
                <button
                    onClick={() => setActiveTab('books')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'books' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'books' ? 'white' : 'black',
                        border: 'none',
                        borderBottom: activeTab === 'books' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    All Books ({books.length})
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'users' ? '#007bff' : '#f8f9fa',
                        color: activeTab === 'users' ? 'white' : 'black',
                        border: 'none',
                        borderBottom: activeTab === 'users' ? '3px solid #007bff' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    All Users ({users.length})
                </button>
            </div>

            {/* Books Tab */}
            {activeTab === 'books' && (
                <div>
                    <h2>All Books</h2>
                    {books.length === 0 ? (
                        <p>No books in the system yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Author</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Genre</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Owner ID</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {books.map((book) => (
                                    <tr key={book.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{book.title}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{book.author}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{book.genre}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{book.status}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{book.user}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <button
                                                onClick={() => handleDeleteBook(book.id)}
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
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>
                    <h2>All Users</h2>
                    {users.length === 0 ? (
                        <p>No users in the system yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Username</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Admin</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.id}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.username}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{u.email}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {u.is_admin ? '✓' : '✗'}
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {u.id !== user?.id ? (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
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
                                            ) : (
                                                <span style={{ color: '#6c757d' }}>Current User</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;