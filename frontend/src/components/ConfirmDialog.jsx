import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '10px',
                padding: '30px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                animation: 'slideIn 0.3s ease'
            }}>
                <h3 style={{ 
                    margin: '0 0 15px 0', 
                    color: '#2c3e50',
                    fontSize: '20px'
                }}>
                    {title}
                </h3>
                <p style={{ 
                    margin: '0 0 25px 0', 
                    color: '#666',
                    fontSize: '16px',
                    lineHeight: '1.5'
                }}>
                    {message}
                </p>
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'flex-end' 
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#ecf0f1',
                            color: '#2c3e50',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#bdc3c7'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ecf0f1'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
                    >
                        Delete
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default ConfirmDialog;