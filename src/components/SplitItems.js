import React, { useState, useEffect } from 'react';
import './SplitItems.css';

const SplitItems = ({ receipt }) => {
    const [friends, setFriends] = useState(['']);
    const [splits, setSplits] = useState({});
    const [totals, setTotals] = useState({});

    useEffect(() => {
        calculateTotals();
    }, [splits]);

    const addFriend = () => {
        setFriends([...friends, '']);
    };

    const removeFriend = (index) => {
        if (friends.length > 1) {
            const updatedFriends = friends.filter((_, i) => i !== index);
            setFriends(updatedFriends);
            
            // Clean up splits for removed friend
            const updatedSplits = { ...splits };
            Object.keys(updatedSplits).forEach(itemIndex => {
                if (updatedSplits[itemIndex][index]) {
                    delete updatedSplits[itemIndex][index];
                }
            });
            setSplits(updatedSplits);
        }
    };

    const updateFriend = (index, name) => {
        const updatedFriends = [...friends];
        updatedFriends[index] = name;
        setFriends(updatedFriends);
    };

    const handleSplitChange = (itemIndex, friendIndex) => {
        setSplits(prevSplits => ({
            ...prevSplits,
            [itemIndex]: {
                ...prevSplits[itemIndex],
                [friendIndex]: !prevSplits[itemIndex]?.[friendIndex]
            }
        }));
    };

    const calculateTotals = () => {
        const newTotals = {};
        receipt.items.forEach((item, itemIndex) => {
            const itemSplits = splits[itemIndex];
            if (itemSplits) {
                const splitCount = Object.values(itemSplits).filter(Boolean).length;
                if (splitCount > 0) {
                    const splitAmount = item.totalPrice / splitCount;
                    Object.entries(itemSplits).forEach(([friendIndex, isSplit]) => {
                        if (isSplit) {
                            const friendName = friends[friendIndex] || `Friend ${parseInt(friendIndex) + 1}`;
                            newTotals[friendName] = (newTotals[friendName] || 0) + splitAmount;
                        }
                    });
                }
            }
        });
        setTotals(newTotals);
    };

    if (!receipt?.items || receipt.items.length === 0) {
        return (
            <div className="split-items card">
                <div className="split-header">
                    <div className="split-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16,9H8V7H16M14,17H10V15H14M14,13H10V11H14M22,3H2A2,2 0 0,0 0,5V19A2,2 0 0,0 2,21H22A2,2 0 0,0 24,19V5A2,2 0 0,0 22,3M22,19H2V5H22V19Z" />
                        </svg>
                    </div>
                    <div className="split-info">
                        <h3>Split Bill</h3>
                        <p>Upload a receipt to start splitting items</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="split-items card">
            <div className="split-header">
                <div className="split-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16,9H8V7H16M14,17H10V15H14M14,13H10V11H14M22,3H2A2,2 0 0,0 0,5V19A2,2 0 0,0 2,21H22A2,2 0 0,0 24,19V5A2,2 0 0,0 22,3M22,19H2V5H22V19Z" />
                    </svg>
                </div>
                <div className="split-info">
                    <h3>Split Bill</h3>
                    <p>Select who pays for each item</p>
                </div>
            </div>

            <div className="friends-section">
                <div className="section-header">
                    <h4>Friends</h4>
                    <button className="btn btn-secondary" onClick={addFriend}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                        </svg>
                        Add Friend
                    </button>
                </div>
                
                <div className="friends-grid">
                    {friends.map((friend, index) => (
                        <div key={index} className="friend-card">
                            <div className="friend-avatar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                                </svg>
                            </div>
                            <input
                                className="input friend-input"
                                type="text"
                                value={friend}
                                onChange={(e) => updateFriend(index, e.target.value)}
                                placeholder={`Friend ${index + 1}`}
                            />
                            {friends.length > 1 && (
                                <button 
                                    className="btn btn-danger remove-friend"
                                    onClick={() => removeFriend(index)}
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="items-section">
                <div className="section-header">
                    <h4>Items to Split</h4>
                    <span className="item-count">{receipt.items.length} items</span>
                </div>

                <div className="items-split-grid">
                    {receipt.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="item-split-card">
                            <div className="item-header">
                                <div className="item-info">
                                    <span className="item-name">{item.description}</span>
                                    <span className="item-price">${item.totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                            
                            <div className="split-options">
                                <div className="split-label">Who's paying?</div>
                                <div className="friend-checkboxes">
                                    {friends.map((friend, friendIndex) => {
                                        const isChecked = splits[itemIndex]?.[friendIndex] || false;
                                        const friendName = friend || `Friend ${friendIndex + 1}`;
                                        
                                        return (
                                            <label key={friendIndex} className={`friend-checkbox ${isChecked ? 'checked' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleSplitChange(itemIndex, friendIndex)}
                                                />
                                                <div className="checkbox-custom">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                                                    </svg>
                                                </div>
                                                <span>{friendName}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {Object.keys(totals).length > 0 && (
                <div className="totals-section">
                    <div className="section-header">
                        <h4>Summary</h4>
                    </div>
                    
                    <div className="totals-grid">
                        {Object.entries(totals).map(([name, total]) => (
                            <div key={name} className="total-card">
                                <div className="total-avatar">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                                    </svg>
                                </div>
                                <div className="total-info">
                                    <span className="total-name">{name}</span>
                                    <span className="total-amount">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SplitItems;