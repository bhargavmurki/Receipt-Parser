
import React, { useState, useRef } from 'react';
import { api } from '../utils/api';
import ReceiptDisplay from './ReceiptDisplay';
import SplitItems from './SplitItems';
import './UploadReceipt.css';

const UploadReceipt = ({ onUploadSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [receipt, setReceipt] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const validateFile = (file) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPEG, PNG, etc.)');
            return false;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            setError('Image file is too large. Please select an image smaller than 10MB.');
            return false;
        }
        
        return true;
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        const file = files[0];
        
        if (file && validateFile(file)) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        setIsLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onloadend = async () => {
            // Get the base64 string without the data URL prefix
            let base64String = reader.result;
            if (base64String.includes(',')) {
                base64String = base64String.split(',')[1];
            }
            
            console.log('File size:', selectedFile.size, 'bytes');
            console.log('File type:', selectedFile.type);
            console.log('Base64 length:', base64String.length);
            try {
                const response = await api.receipts.process(base64String);
                console.log('Receipt processed successfully:', response);
                
                // Handle the new response format
                const receiptData = response.receipt || response.data || response;
                setReceipt(receiptData);
                onUploadSuccess(receiptData);
            } catch (error) {
                console.error('Error uploading receipt:', error);
                
                // Enhanced error handling with new error codes
                if (error.code === 'INVALID_IMAGE' || error.code === 'INVALID_IMAGE_FORMAT') {
                    setError('Invalid image file. Please upload a clear JPEG, PNG, GIF, BMP, or WEBP image.');
                } else if (error.code === 'EXTRACTION_FAILED') {
                    setError('Could not extract receipt data from this image. Please ensure the image is clear and contains a valid receipt.');
                } else if (error.code === 'SERVICE_UNAVAILABLE' || error.code === 'AZURE_QUOTA_EXCEEDED') {
                    setError('Receipt analysis service is temporarily unavailable. Please try again later.');
                } else if (error.code === 'QUOTA_EXCEEDED' || error.status === 429) {
                    setError('Too many requests. Please wait a moment before trying again.');
                } else if (error.isNetworkError) {
                    setError('Cannot connect to server. Please check your internet connection.');
                } else if (error.code === 'AUTH_REQUIRED' || error.status === 401) {
                    setError('Authentication required. Please log in again.');
                } else {
                    setError(error.message || 'Failed to process the receipt. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsDataURL(selectedFile);
    };

    return (
        <div className="upload-receipt">
            <div className="card">
                <div className="upload-header">
                    <div className="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                    </div>
                    <h2>Upload Receipt</h2>
                    <p>Drag and drop your receipt image or click to browse</p>
                </div>

                <div 
                    className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFileDialog}
                >
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        onChange={handleFileChange} 
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    
                    {selectedFile ? (
                        <div className="file-preview">
                            <div className="file-info">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M6,20H15L18,20V12L14,16L12,14L6,20Z" />
                                </svg>
                                <div className="file-details">
                                    <span className="file-name">{selectedFile.name}</span>
                                    <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                            <button 
                                className="btn btn-danger remove-file"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFile(null);
                                    setReceipt(null);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div className="upload-placeholder">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,11L16,15H13.5V19H10.5V15H8L12,11Z" />
                            </svg>
                            <h3>Drop your receipt here</h3>
                            <p>or click to browse files</p>
                            <span className="supported-formats">Supports: JPEG, PNG, GIF, BMP, WEBP (max 10MB)</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="alert alert-error">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        {error}
                    </div>
                )}

                <div className="upload-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={handleUpload} 
                        disabled={isLoading || !selectedFile}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Processing Receipt...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                                </svg>
                                Analyze Receipt
                            </>
                        )}
                    </button>
                </div>
            </div>

            {receipt && (
                <div className="receipt-results">
                    <ReceiptDisplay receipt={receipt} />
                    <SplitItems receipt={receipt} />
                </div>
            )}
        </div>
    );
};

export default UploadReceipt;
