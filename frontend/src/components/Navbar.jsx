import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navButtonStyle = (path) => ({
        padding: '10px 20px',
        marginRight: '10px',
        backgroundColor: isActive(path) ? '#0056b3' : '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: isActive(path) ? 'bold' : 'normal',
        transition: 'all 0.2s'
    });

    return (
        <nav style={{
            backgroundColor: '#f8f9fa',
            padding: '15px 30px',
            borderBottom: '2px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
        }}>
            {/* Left side - Brand/Logo */}
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                📚 Library Management
            </div>

            {/* Right side - Navigation */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Dashboard */}
                <button
                    onClick={() => navigate('/dashboard')}
                    style={navButtonStyle('/dashboard')}
                    onMouseEnter={(e) => {
                        if (!isActive('/dashboard')) {
                            e.target.style.backgroundColor = '#0056b3';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/dashboard')) {
                            e.target.style.backgroundColor = '#007bff';
                        }
                    }}
                >
                    My Books
                </button>

                {/* AI Chat */}
                <button
                    onClick={() => navigate('/ai-chat')}
                    style={navButtonStyle('/ai-chat')}
                    onMouseEnter={(e) => {
                        if (!isActive('/ai-chat')) {
                            e.target.style.backgroundColor = '#0056b3';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/ai-chat')) {
                            e.target.style.backgroundColor = '#007bff';
                        }
                    }}
                >
                    🤖 AI Chat
                </button>

                {/* Admin Dashboard (only for admins) */}
                {user?.is_admin && (
                    <button
                        onClick={() => navigate('/admin')}
                        style={navButtonStyle('/admin')}
                        onMouseEnter={(e) => {
                            if (!isActive('/admin')) {
                                e.target.style.backgroundColor = '#0056b3';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin')) {
                                e.target.style.backgroundColor = '#007bff';
                            }
                        }}
                    >
                        Admin
                    </button>
                )}

                {/* User Info */}
                <span style={{ 
                    marginRight: '15px', 
                    marginLeft: '20px',
                    color: '#666',
                    fontSize: '14px'
                }}>
                    {user?.username}
                </span>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;