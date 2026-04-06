const path = require('path');
const Datastore = require('nedb-promises');

// Database configuration
const dbConfig = {
    receipts: {
        filename: path.join(__dirname, 'receipts.db'),
        autoload: true,
        timestampData: true
    },
    users: {
        filename: path.join(__dirname, 'users.db'),
        autoload: true,
        timestampData: true
    }
};

// Create database instances
const receiptsDb = Datastore.create(dbConfig.receipts);
const usersDb = Datastore.create(dbConfig.users);

// Create indexes for better performance
const createIndexes = async () => {
    try {
        // Users database indexes
        await usersDb.ensureIndex({ fieldName: 'email', unique: true });
        await usersDb.ensureIndex({ fieldName: 'provider' });
        await usersDb.ensureIndex({ fieldName: 'isDeactivated' });
        
        // Receipts database indexes
        await receiptsDb.ensureIndex({ fieldName: 'userId' });
        await receiptsDb.ensureIndex({ fieldName: 'type' });
        await receiptsDb.ensureIndex({ fieldName: 'createdAt' });
        await receiptsDb.ensureIndex({ fieldName: 'date' });
        await receiptsDb.ensureIndex({ fieldName: 'total' });
        
        // Compound indexes for common queries
        await receiptsDb.ensureIndex({ fieldName: ['type', 'userId'] });
        await receiptsDb.ensureIndex({ fieldName: ['userId', 'createdAt'] });
        
        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating database indexes:', error);
    }
};

// Initialize databases
const initializeDatabases = async () => {
    try {
        await createIndexes();
        console.log('✅ Databases initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing databases:', error);
        throw error;
    }
};

// Database health check
const healthCheck = async () => {
    try {
        const receiptsCount = await receiptsDb.count({});
        const usersCount = await usersDb.count({});
        
        return {
            receipts: {
                count: receiptsCount,
                status: 'healthy'
            },
            users: {
                count: usersCount,
                status: 'healthy'
            }
        };
    } catch (error) {
        console.error('Database health check failed:', error);
        throw error;
    }
};

// Clean up old data (optional, for maintenance)
const cleanupOldData = async (daysOld = 365) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        // Remove old receipts (optional - uncomment if needed)
        // const removedReceipts = await receiptsDb.remove(
        //     { 
        //         createdAt: { $lt: cutoffDate.toISOString() },
        //         type: 'receipt'
        //     }, 
        //     { multi: true }
        // );
        
        console.log(`Cleanup completed for data older than ${daysOld} days`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
};

module.exports = {
    receiptsDb,
    usersDb,
    initializeDatabases,
    healthCheck,
    cleanupOldData
};