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
        backgroundColor: 'transparent',
        color: '#2c3e50',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: isActive(path) ? '600' : 'normal',
        transition: 'all 0.3s ease',
        borderBottom: isActive(path) ? '3px solid #3498db' : '3px solid transparent'
    });

    return (
        <nav style={{
            backgroundColor: '#ecf0f1',
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderBottom: '1px solid #bdc3c7'
        }}>
            {/* Left side - Brand/Logo */}
            <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span>📚</span>
                <span>Library Management</span>
            </div>

            {/* Right side - Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {/* Dashboard */}
                <button
                    onClick={() => navigate('/dashboard')}
                    style={navButtonStyle('/dashboard')}
                    onMouseEnter={(e) => {
                        if (!isActive('/dashboard')) {
                            e.target.style.backgroundColor = '#d5dbdb';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/dashboard')) {
                            e.target.style.backgroundColor = 'transparent';
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
                            e.target.style.backgroundColor = '#d5dbdb';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive('/ai-chat')) {
                            e.target.style.backgroundColor = 'transparent';
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
                                e.target.style.backgroundColor = '#d5dbdb';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive('/admin')) {
                                e.target.style.backgroundColor = 'transparent';
                            }
                        }}
                    >
                        Admin
                    </button>
                )}

                {/* Divider */}
                <div style={{
                    width: '1px',
                    height: '30px',
                    backgroundColor: '#bdc3c7',
                    margin: '0 15px'
                }}></div>

                {/* User Info - Pill Style */}
                <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#d5dbdb',
                    borderRadius: '20px',
                    color: '#2c3e50',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginRight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: '1px solid #bdc3c7'
                }}>
                    <span style={{ fontSize: '16px' }}>👤</span>
                    <span>Welcome, {user?.username}</span>
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: 'transparent',
                        color: '#e74c3c',
                        border: '2px solid #e74c3c',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e74c3c';
                        e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#e74c3c';
                    }}
                >
                    Logout
                </button>
            </div>
        </nav>
    );
};

export default Navbar;