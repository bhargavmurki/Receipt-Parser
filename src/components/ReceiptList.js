import React, { useState } from 'react';
import axios from 'axios';
import ReceiptDisplay from './ReceiptDisplay';
import SplitItems from './SplitItems';
import Loading from './Loading';
import ConfirmModal from './ConfirmModal';
import './ReceiptList.css';

const API_PORT = process.env.REACT_APP_API_PORT || 5002;
const API_URL = `http://localhost:${API_PORT}/receipts`;

const ReceiptList = ({ receipts, setReceipts }) => {
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState(null);

    const handleReceiptSelect = (receipt) => {
        setSelectedReceipt(receipt);
    };

    const handleDeleteClick = (receipt) => {
        setReceiptToDelete(receipt);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!receiptToDelete || !receiptToDelete.id) {
            setError('Invalid receipt ID.');
            return;
        }
        try {
            await axios.delete(`${API_URL}/${receiptToDelete.id}`);
            setReceipts(receipts.filter(r => r.id !== receiptToDelete.id));
            if (selectedReceipt && selectedReceipt.id === receiptToDelete.id) {
                setSelectedReceipt(null);
            }
        } catch (error) {
            console.error('Error deleting receipt:', error);
            setError('Failed to delete receipt. Please try again.');
        } finally {
            setIsDeleteModalOpen(false);
            setReceiptToDelete(null);
        }
    };

    if (receipts.length === 0) {
        return (
            <div className="receipt-list card">
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                        </svg>
                    </div>
                    <h3>No receipts yet</h3>
                    <p>Upload your first receipt to get started with bill splitting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="receipt-list">
            <div className="card">
                <div className="receipts-header">
                    <div className="header-info">
                        <h2>Previous Receipts</h2>
                        <p>Click any receipt to view details and split bills</p>
                    </div>
                    <div className="receipts-count">
                        <span className="count-number">{receipts.length}</span>
                        <span className="count-label">{receipts.length === 1 ? 'Receipt' : 'Receipts'}</span>
                    </div>
                </div>

                {isLoading && <Loading />}
                {error && (
                    <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="receipts-grid">
                    {receipts.map((receipt) => (
                        <div 
                            key={receipt.id} 
                            className={`receipt-card ${selectedReceipt?.id === receipt.id ? 'selected' : ''}`}
                            onClick={() => handleReceiptSelect(receipt)}
                        >
                            <div className="receipt-card-header">
                                <div className="receipt-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M3,22L9,16L15,22H3M16,1H8A2,2 0 0,0 6,3V7H18V3A2,2 0 0,0 16,1Z" />
                                    </svg>
                                </div>
                                <div className="receipt-meta">
                                    <h3 className="receipt-name">{receipt.name}</h3>
                                    <p className="receipt-date">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                                        </svg>
                                        {new Date(receipt.date).toLocaleDateString()}
                                    </p>
                                </div>
                                <button 
                                    className="btn btn-danger delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(receipt);
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="receipt-card-body">
                                <div className="receipt-summary">
                                    <div className="summary-item">
                                        <span className="label">Total</span>
                                        <span className="value">${receipt.total?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    {receipt.taxAmount && (
                                        <div className="summary-item">
                                            <span className="label">Tax</span>
                                            <span className="value">${receipt.taxAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="summary-item">
                                        <span className="label">Items</span>
                                        <span className="value">{receipt.items?.length || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="receipt-card-footer">
                                <span className="select-hint">Click to view details</span>
                                {selectedReceipt?.id === receipt.id && (
                                    <span className="selected-indicator">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                                        </svg>
                                        Selected
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedReceipt && (
                <div className="selected-receipt">
                    <ReceiptDisplay receipt={selectedReceipt} />
                    <SplitItems receipt={selectedReceipt} />
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this receipt?"
            />
        </div>
    );
};

export default ReceiptList;
