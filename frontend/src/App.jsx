import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AiChat from './pages/AiChat';

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <Router>
            <div className="App">
                <Routes>
                    {/* Public Routes */}
                    <Route 
                        path="/login" 
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                        } 
                    />
                    <Route 
                        path="/register" 
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
                        } 
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/ai-chat"
                        element={
                            <ProtectedRoute>
                                <AiChat />
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Route */}
                    <Route 
                        path="/" 
                        element={
                            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                        } 
                    />

                    {/* 404 Route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;