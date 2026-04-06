import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, onTabChange, receiptsCount }) => {
    console.log('Navigation rendering with activeTab:', activeTab, 'receiptsCount:', receiptsCount);
    
    const tabs = [
        {
            id: 'upload',
            label: 'Upload Receipt',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
            ),
            description: 'Add new receipts'
        },
        {
            id: 'receipts',
            label: 'My Receipts',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5A2,2 0 0,0 3,5M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z" />
                </svg>
            ),
            description: 'View and manage receipts',
            badge: receiptsCount
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
                </svg>
            ),
            description: 'Analytics and insights'
        }
    ];

    return (
        <nav className="navigation">
            <div className="nav-container">
                <div className="nav-tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => onTabChange(tab.id)}
                        >
                            <div className="tab-icon">{tab.icon}</div>
                            <div className="tab-content">
                                <span className="tab-label">{tab.label}</span>
                                <span className="tab-description">{tab.description}</span>
                            </div>
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="tab-badge">{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;