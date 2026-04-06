import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import UploadReceipt from './components/UploadReceipt';
import ReceiptList from './components/ReceiptList';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import Auth from './components/Auth';
import UserInfo from './components/UserInfo';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const AppContent = () => {
    const [receipts, setReceipts] = useState([]);
    const [activeTab, setActiveTab] = useState('upload');
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        const fetchReceipts = async () => {
            if (!isAuthenticated) return;
            
            try {
                const response = await api.receipts.list();
                // Handle the new paginated response format
                const receiptsData = response.receipts || response.data || response;
                setReceipts(Array.isArray(receiptsData) ? receiptsData : []);
            } catch (error) {
                console.error('Error fetching receipts:', error);
                
                if (error.code === 'AUTH_REQUIRED' || error.status === 401) {
                    console.warn('Authentication required, user will be logged out');
                } else if (!error.isNetworkError) {
                    console.error('Failed to fetch receipts:', error.message);
                }
            }
        };

        fetchReceipts();
    }, [isAuthenticated]); // Refetch when auth status changes

    const handleUploadSuccess = (newReceipt) => {
        setReceipts(prevReceipts => [newReceipt, ...prevReceipts]);
        // Optionally switch to receipts tab after successful upload
        setActiveTab('receipts');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    if (loading) {
        return (
            <div className="app">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="app">
                <header className="app-header">
                    <div className="header-content">
                        <div className="logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            <h1>Receipt Parser</h1>
                        </div>
                        <p className="tagline">Smart receipt analysis and bill splitting</p>
                    </div>
                </header>
                <main className="main-content">
                    <div className="container">
                        <Auth />
                    </div>
                </main>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'upload':
                return <UploadReceipt onUploadSuccess={handleUploadSuccess} />;
            case 'receipts':
                return <ReceiptList receipts={receipts} setReceipts={setReceipts} />;
            case 'dashboard':
                return <Dashboard receipts={receipts} />;
            default:
                return <UploadReceipt onUploadSuccess={handleUploadSuccess} />;
        }
    };

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div className="header-left">
                        <div className="logo">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                            <h1>Receipt Parser</h1>
                        </div>
                        <p className="tagline">Smart receipt analysis and bill splitting</p>
                    </div>
                    <div className="header-right">
                        <UserInfo />
                    </div>
                </div>
            </header>
            
            <Navigation 
                activeTab={activeTab} 
                onTabChange={handleTabChange}
                receiptsCount={receipts.length}
            />
            
            <main className="main-content">
                <div className="container">
                    <div className="tab-content">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;