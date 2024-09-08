import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReceiptDisplay from './ReceiptDisplay';
import SplitItems from './SplitItems';
import Loading from './Loading';
import ConfirmModal from './ConfirmModal';
import './ReceiptList.css';

const API_PORT = process.env.REACT_APP_API_PORT || 5002;
const API_URL = `http://localhost:${API_PORT}/receipts`;

const ReceiptList = () => {
    const [receipts, setReceipts] = useState([]);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState(null);

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL);
            setReceipts(response.data);
        } catch (error) {
            console.error('Error fetching receipts:', error);
            setError('Failed to fetch receipts. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <div className="receipt-list">
            <h2>Previous Receipts</h2>
            {isLoading && <Loading />}
            {error && <p className="error-message">{error}</p>}
            <ul>
                {receipts.map((receipt) => (
                    <li key={receipt.id}>
                        <span onClick={() => handleReceiptSelect(receipt)}>
                            {receipt.name} - {new Date(receipt.date).toLocaleDateString()}
                        </span>
                        <button className="delete-button" onClick={() => handleDeleteClick(receipt)}>Delete</button>
                    </li>
                ))}
            </ul>
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
