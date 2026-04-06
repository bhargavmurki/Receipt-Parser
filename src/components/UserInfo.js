import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const UserInfo = () => {
    const { user, logout, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return null;
    }

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="user-info">
            <div className="user-avatar">
                {getInitials(user.name)}
            </div>
            <div className="user-details">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
            </div>
            <button onClick={logout} className="logout-button">
                Sign Out
            </button>
        </div>
    );
};

export default UserInfo;