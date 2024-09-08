import React from 'react';
import './ReceiptDisplay.css';

const ReceiptDisplay = ({ receipt }) => {
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="receipt-display">
            <h3>Receipt Details</h3>
            <div className="receipt-header">
                <p><strong>{receipt.name}</strong></p>
                <p>Date: {formatDate(receipt.date)}</p>
                <p>Total: ${receipt.total.toFixed(2)}</p>
            </div>
            <table>
                <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                </tr>
                </thead>
                <tbody>
                {receipt.items.map((item, index) => (
                    <tr key={index} className={item.isWeighted ? 'weighted-item' : ''}>
                        <td>{item.description}</td>
                        <td>{item.quantity.toFixed(2)} {item.isWeighted ? 'lb' : ''}</td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>${item.totalPrice.toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReceiptDisplay;