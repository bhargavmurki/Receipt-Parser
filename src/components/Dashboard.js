import React, { useMemo } from 'react';
import './Dashboard.css';

const Dashboard = ({ receipts }) => {
    const analytics = useMemo(() => {
        if (!receipts || receipts.length === 0) {
            return {
                totalReceipts: 0,
                totalAmount: 0,
                avgAmount: 0,
                recentActivity: [],
                monthlySpending: {},
                topCategories: []
            };
        }

        const totalAmount = receipts.reduce((sum, receipt) => {
            return sum + (parseFloat(receipt.total) || 0);
        }, 0);

        const avgAmount = totalAmount / receipts.length;

        // Group by month for spending trends
        const monthlySpending = receipts.reduce((acc, receipt) => {
            const date = new Date(receipt.createdAt || receipt.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            acc[monthKey] = (acc[monthKey] || 0) + (parseFloat(receipt.total) || 0);
            return acc;
        }, {});

        // Recent activity (last 5 receipts)
        const recentActivity = [...receipts]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5);

        // Mock categories (since we don't have category data)
        const categories = ['Food & Dining', 'Shopping', 'Gas & Transportation', 'Entertainment', 'Groceries'];
        const topCategories = categories.slice(0, 3).map((category, index) => ({
            name: category,
            amount: totalAmount * (0.4 - index * 0.1),
            percentage: (40 - index * 10)
        }));

        return {
            totalReceipts: receipts.length,
            totalAmount,
            avgAmount,
            recentActivity,
            monthlySpending,
            topCategories
        };
    }, [receipts]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    if (analytics.totalReceipts === 0) {
        return (
            <div className="dashboard">
                <div className="dashboard-empty">
                    <div className="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z" />
                        </svg>
                    </div>
                    <h3>No Data Yet</h3>
                    <p>Upload some receipts to see your spending analytics and insights.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Dashboard</h2>
                <p>Your spending insights and analytics</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{analytics.totalReceipts}</div>
                        <div className="stat-label">Total Receipts</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(analytics.totalAmount)}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{formatCurrency(analytics.avgAmount)}</div>
                        <div className="stat-label">Average Receipt</div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Top Categories</h3>
                        <p>Your highest spending categories</p>
                    </div>
                    <div className="categories-list">
                        {analytics.topCategories.map((category, index) => (
                            <div key={index} className="category-item">
                                <div className="category-info">
                                    <div className="category-name">{category.name}</div>
                                    <div className="category-amount">{formatCurrency(category.amount)}</div>
                                </div>
                                <div className="category-bar">
                                    <div 
                                        className="category-progress" 
                                        style={{ width: `${category.percentage}%` }}
                                    ></div>
                                </div>
                                <div className="category-percentage">{category.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Recent Activity</h3>
                        <p>Your latest receipts</p>
                    </div>
                    <div className="activity-list">
                        {analytics.recentActivity.map((receipt, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                </div>
                                <div className="activity-content">
                                    <div className="activity-name">{receipt.name || 'Receipt'}</div>
                                    <div className="activity-date">{formatDate(receipt.createdAt || receipt.date)}</div>
                                </div>
                                <div className="activity-amount">{formatCurrency(receipt.total || 0)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-card monthly-card">
                    <div className="card-header">
                        <h3>Monthly Spending</h3>
                        <p>Spending trends over time</p>
                    </div>
                    <div className="monthly-chart">
                        {Object.entries(analytics.monthlySpending)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .slice(-6)
                            .map(([month, amount]) => {
                                const maxAmount = Math.max(...Object.values(analytics.monthlySpending));
                                const height = (amount / maxAmount) * 100;
                                return (
                                    <div key={month} className="chart-bar">
                                        <div className="bar-container">
                                            <div 
                                                className="bar" 
                                                style={{ height: `${height}%` }}
                                                title={formatCurrency(amount)}
                                            ></div>
                                        </div>
                                        <div className="bar-label">
                                            {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                                        </div>
                                        <div className="bar-amount">{formatCurrency(amount)}</div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
