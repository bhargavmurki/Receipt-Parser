import React from 'react';
import './ReceiptDisplay.css';

const ReceiptDisplay = ({ receipt }) => {
    // Extract relevant data from the receipt response
    const merchantName = receipt?.name || 'Unknown Merchant';
    const receiptDate = receipt?.date || new Date();
    const receiptTotal = receipt?.total || 0;
    const subtotal = receipt?.subtotal;
    const taxAmount = receipt?.taxAmount;
    const items = receipt?.items || [];

    return (
        <div className="receipt-display card">
            <div className="receipt-header">
                <div className="receipt-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3,22L9,16L15,22H3M16,1H8A2,2 0 0,0 6,3V7H18V3A2,2 0 0,0 16,1Z" />
                    </svg>
                </div>
                <div className="receipt-info">
                    <h3>Receipt Details</h3>
                    <p className="merchant-name">{merchantName}</p>
                    <p className="receipt-date">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z" />
                        </svg>
                        {new Date(receiptDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="receipt-summary">
                <div className="summary-grid">
                    {subtotal && (
                        <div className="summary-item">
                            <span className="summary-label">Subtotal</span>
                            <span className="summary-value">${subtotal.toFixed(2)}</span>
                        </div>
                    )}
                    {taxAmount && (
                        <div className="summary-item">
                            <span className="summary-label">Tax</span>
                            <span className="summary-value">${taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    {!taxAmount && subtotal && receiptTotal && (receiptTotal - subtotal > 0.01) && (
                        <div className="summary-item">
                            <span className="summary-label">Tax (est.)</span>
                            <span className="summary-value">${(receiptTotal - subtotal).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="summary-item total">
                        <span className="summary-label">Total</span>
                        <span className="summary-value">${receiptTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="receipt-items">
                <div className="items-header">
                    <h4>Items</h4>
                    <span className="item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                </div>
                
                {items.length > 0 ? (
                    <div className="items-list">
                        {items.map((item, index) => (
                            <div key={index} className="item-card">
                                <div className="item-info">
                                    <div className="item-name">{item.description}</div>
                                    <div className="item-details">
                                        <span className="item-quantity">{item.quantity}x</span>
                                        <span className="item-price">${item.price.toFixed(2)} each</span>
                                    </div>
                                </div>
                                <div className="item-total">${item.totalPrice.toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-items">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1,1 0 0,1 11,16A1,1 0 0,1 12,15A1,1 0 0,1 13,16A1,1 0 0,1 12,17M12,13.5C11.31,13.5 10.75,12.94 10.75,12.25L10.82,8.5C10.82,7.81 11.38,7.25 12.07,7.25C12.76,7.25 13.32,7.81 13.32,8.5L13.25,12.25C13.25,12.94 12.69,13.5 12,13.5Z" />
                        </svg>
                        <p>No items found in this receipt</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceiptDisplay;