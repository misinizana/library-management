import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
    adminGetAllUsers,
    adminGetUserDetail,
    adminUpdateUser,
    adminDeleteUser,
    adminUpdateBook,
    adminDeleteBook,
    adminGetAnalytics
} from '../services/api';
import { 
    LineChart, Line, 
    BarChart, Bar, 
    PieChart, Pie, Cell,
    XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer 
} from 'recharts';

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'analytics'
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Edit states
    const [editingUser, setEditingUser] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        is_admin: false,
    });
    const [bookFormData, setBookFormData] = useState({
        title: '',
        author: '',
        genre: '',
        status: '',
        cover_image: '',
        description: '',
        page_count: '',
    });

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'users' && !selectedUser) {
            fetchUsers();
        } else if (activeTab === 'analytics') {
            fetchAnalytics();
        }
    }, [activeTab, selectedUser]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminGetAllUsers();
            setUsers(data);
        } catch (err) {
            setError('Failed to load users. You may not have admin permissions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminGetAnalytics();
            setAnalytics(data);
        } catch (err) {
            setError('Failed to load analytics.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewUser = async (userId) => {
        try {
            setLoading(true);
            const data = await adminGetUserDetail(userId);
            setSelectedUser(data);
        } catch (err) {
            setError('Failed to load user details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setSelectedUser(null);
        setEditingUser(false);
        setEditingBook(null);
    };

    // User Edit
    const startEditUser = () => {
        setUserFormData({
            username: selectedUser.username,
            email: selectedUser.email,
            is_admin: selectedUser.is_admin,
        });
        setEditingUser(true);
    };

    const handleUserFormChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setUserFormData({
            ...userFormData,
            [e.target.name]: value,
        });
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await adminUpdateUser(selectedUser.id, userFormData);
            setEditingUser(false);
            handleViewUser(selectedUser.id);
        } catch (err) {
            setError('Failed to update user');
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user? This will also delete all their books.')) {
            try {
                await adminDeleteUser(userId);
                handleBackToList();
            } catch (err) {
                setError('Failed to delete user');
                console.error(err);
            }
        }
    };

    // Book Edit
    const startEditBook = (book) => {
        setBookFormData({
            title: book.title,
            author: book.author,
            genre: book.genre,
            status: book.status,
            cover_image: book.cover_image || '',
            description: book.description || '',
            page_count: book.page_count || '',
        });
        setEditingBook(book.id);
    };

    const handleBookFormChange = (e) => {
        setBookFormData({
            ...bookFormData,
            [e.target.name]: e.target.value,
        });
    };

    const handleUpdateBook = async (e) => {
        e.preventDefault();
        try {
            await adminUpdateBook(editingBook, bookFormData);
            setEditingBook(null);
            handleViewUser(selectedUser.id);
        } catch (err) {
            setError('Failed to update book');
            console.error(err);
        }
    };

    const handleDeleteBook = async (bookId) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await adminDeleteBook(bookId);
                handleViewUser(selectedUser.id);
            } catch (err) {
                setError('Failed to delete book');
                console.error(err);
            }
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
    <div>
        <Navbar />
        
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Admin Dashboard</h1>
        
        </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            {/* Tabs - Only show when not viewing user details */}
            {!selectedUser && (
                <div style={{ marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
                    <button
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === 'users' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'users' ? 'white' : 'black',
                            border: 'none',
                            borderBottom: activeTab === 'users' ? '3px solid #007bff' : 'none',
                            cursor: 'pointer',
                            marginRight: '10px'
                        }}
                    >
                        Manage Users
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeTab === 'analytics' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'analytics' ? 'white' : 'black',
                            border: 'none',
                            borderBottom: activeTab === 'analytics' ? '3px solid #007bff' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Analytics
                    </button>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && analytics && (
                <div>
                    <h2>System Analytics</h2>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#007bff' }}>
                                {analytics.summary.total_users}
                            </h3>
                            <p style={{ margin: 0, color: '#666' }}>Total Users</p>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#28a745' }}>
                                {analytics.summary.active_users}
                            </h3>
                            <p style={{ margin: 0, color: '#666' }}>Active Users</p>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#ffc107' }}>
                                {analytics.summary.total_books}
                            </h3>
                            <p style={{ margin: 0, color: '#666' }}>Total Books</p>
                        </div>
                        <div style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '36px', color: '#dc3545' }}>
                                {analytics.summary.avg_books_per_user}
                            </h3>
                            <p style={{ margin: 0, color: '#666' }}>Avg Books/User</p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        {/* Books Over Time */}
                        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
                            <h3>Books Added (Last 30 Days)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={analytics.books_over_time}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" stroke="#007bff" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Genre Distribution - PIE CHART */}
                        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
                            <h3>Books by Genre</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={analytics.genre_distribution}
                                        dataKey="count"
                                        nameKey="genre"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="#8884d8"
                                        label
                                    >
                                        {analytics.genre_distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Popular Books - BAR CHART */}
                    <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '30px' }}>
                        <h3>Most Popular Books</h3>
                        {analytics.popular_books.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analytics.popular_books}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="user_count" fill="#ffc107" name="Users" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                                No popular books yet (need 2+ users with same book)
                            </p>
                        )}
                    </div>

                    {/* Recent Activity Table */}
                    <div style={{ border: '1px solid #ddd', padding: '20px' }}>
                        <h3>Recent Activity</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Book</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Author</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>User</th>
                                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.recent_activity.map((activity) => (
                                    <tr key={activity.id}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{activity.title}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{activity.author}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{activity.username}</td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            {new Date(activity.added_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* USER LIST VIEW */}
            {activeTab === 'users' && !selectedUser && (
                <div>
                    <h2>Manage Users ({users.length})</h2>
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
                                        <button
                                            onClick={() => handleViewUser(u.id)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer',
                                                marginRight: '5px'
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* USER DETAIL VIEW */}
            {activeTab === 'users' && selectedUser && (
                <div>
                    <button 
                        onClick={handleBackToList}
                        style={{ 
                            padding: '8px 16px', 
                            marginBottom: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        ← Back to Users List
                    </button>

                    {/* User Info Section */}
                    <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px' }}>
                        <h2>User Details</h2>
                        
                        {!editingUser ? (
                            <div>
                                <p><strong>Username:</strong> {selectedUser.username}</p>
                                <p><strong>Email:</strong> {selectedUser.email}</p>
                                <p><strong>Admin:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}</p>
                                <p><strong>Joined:</strong> {new Date(selectedUser.date_joined).toLocaleDateString()}</p>
                                
                                <div style={{ marginTop: '15px' }}>
                                    <button
                                        onClick={startEditUser}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#ffc107',
                                            border: 'none',
                                            marginRight: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit User
                                    </button>
                                    {selectedUser.id !== user?.id && (
                                        <button
                                            onClick={() => handleDeleteUser(selectedUser.id)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Delete User
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleUpdateUser}>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Username:</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={userFormData.username}
                                        onChange={handleUserFormChange}
                                        required
                                        style={{ width: '100%', padding: '8px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={userFormData.email}
                                        onChange={handleUserFormChange}
                                        required
                                        style={{ width: '100%', padding: '8px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="is_admin"
                                            checked={userFormData.is_admin}
                                            onChange={handleUserFormChange}
                                        />
                                        {' '}Admin
                                    </label>
                                </div>
                                <button 
                                    type="submit"
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        marginRight: '10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save Changes
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditingUser(false)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </div>

                    {/* User Stats */}
                    <div style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
                        <h3>Statistics</h3>
                        <p><strong>Total Books:</strong> {selectedUser.stats.total_books}</p>
                        <p><strong>Currently Reading:</strong> {selectedUser.stats.books_reading}</p>
                        <p><strong>Completed:</strong> {selectedUser.stats.books_completed}</p>
                        <p><strong>To Read:</strong> {selectedUser.stats.books_to_read}</p>
                    </div>

                    {/* User's Books */}
                    <div>
                        <h3>Books ({selectedUser.books.length})</h3>
                        {selectedUser.books.length === 0 ? (
                            <p>This user has no books yet.</p>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                                {selectedUser.books.map((book) => (
                                    <div 
                                        key={book.id}
                                        style={{ 
                                            border: '1px solid #ddd', 
                                            padding: '15px', 
                                            borderRadius: '5px' 
                                        }}
                                    >
                                        {editingBook === book.id ? (
                                            <form onSubmit={handleUpdateBook}>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label>Title:</label>
                                                    <input
                                                        type="text"
                                                        name="title"
                                                        value={bookFormData.title}
                                                        onChange={handleBookFormChange}
                                                        required
                                                        style={{ width: '100%', padding: '5px' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label>Author:</label>
                                                    <input
                                                        type="text"
                                                        name="author"
                                                        value={bookFormData.author}
                                                        onChange={handleBookFormChange}
                                                        required
                                                        style={{ width: '100%', padding: '5px' }}
                                                    />
                                                </div>
                                                <div style={{ marginBottom: '10px' }}>
                                                    <label>Genre:</label>
                                                    <select
                                                        name="genre"
                                                        value={bookFormData.genre}
                                                        onChange={handleBookFormChange}
                                                        style={{ width: '100%', padding: '5px' }}
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
                                                        value={bookFormData.status}
                                                        onChange={handleBookFormChange}
                                                        style={{ width: '100%', padding: '5px' }}
                                                    >
                                                        <option value="to_read">To Read</option>
                                                        <option value="reading">Reading</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </div>
                                                <button 
                                                    type="submit"
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        border: 'none',
                                                        marginRight: '5px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditingBook(null)}
                                                    style={{
                                                        padding: '5px 10px',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                {book.cover_image && (
                                                    <img 
                                                        src={book.cover_image} 
                                                        alt={book.title}
                                                        style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '10px' }}
                                                    />
                                                )}
                                                <h4>{book.title}</h4>
                                                <p><strong>Author:</strong> {book.author}</p>
                                                <p><strong>Genre:</strong> {book.genre}</p>
                                                <p><strong>Status:</strong> {book.status}</p>
                                                {book.page_count && <p><strong>Pages:</strong> {book.page_count}</p>}
                                                
                                                <div style={{ marginTop: '10px' }}>
                                                    <button
                                                        onClick={() => startEditBook(book)}
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
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;