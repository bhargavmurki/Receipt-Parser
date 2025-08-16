import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadReceipt from './components/UploadReceipt';
import ReceiptList from './components/ReceiptList';
import './App.css';

const API_PORT = process.env.REACT_APP_API_PORT || 5002;
const API_URL = `http://localhost:${API_PORT}/receipts`;

const App = () => {
    const [receipts, setReceipts] = useState([]);

    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const response = await axios.get(API_URL);
                setReceipts(response.data);
            } catch (error) {
                console.error('Error fetching receipts:', error);
            }
        };

        fetchReceipts();
    }, []);

    const handleUploadSuccess = (newReceipt) => {
        setReceipts(prevReceipts => [newReceipt, ...prevReceipts]);
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
                    <div className="header-stats">
                        <div className="stat">
                            <span className="stat-number">{receipts.length}</span>
                            <span className="stat-label">Receipts</span>
                        </div>
                    </div>
                </div>
            </header>
            <main className="main-content">
                <div className="container">
                    <UploadReceipt onUploadSuccess={handleUploadSuccess} />
                    <ReceiptList receipts={receipts} setReceipts={setReceipts} />
                </div>
            </main>
        </div>
    );
};

export default App;