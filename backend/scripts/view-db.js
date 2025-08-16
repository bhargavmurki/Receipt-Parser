const db = require('../models/db');

async function viewDatabase() {
    try {
        console.log('=== Receipt Database Contents ===\n');
        
        // Get all receipts
        const receipts = await db.find({ type: 'receipt' });
        
        console.log(`Total receipts: ${receipts.length}\n`);
        
        receipts.forEach((receipt, index) => {
            console.log(`--- Receipt ${index + 1} ---`);
            console.log(`ID: ${receipt._id}`);
            console.log(`Name: ${receipt.name}`);
            console.log(`Date: ${receipt.date}`);
            console.log(`Total: $${receipt.total}`);
            if (receipt.subtotal) console.log(`Subtotal: $${receipt.subtotal}`);
            if (receipt.taxAmount) console.log(`Tax: $${receipt.taxAmount}`);
            console.log(`Items: ${receipt.items?.length || 0}`);
            if (receipt.items?.length > 0) {
                receipt.items.forEach((item, i) => {
                    console.log(`  ${i + 1}. ${item.description} - $${item.totalPrice}`);
                });
            }
            console.log(`Created: ${receipt.createdAt}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error reading database:', error);
    }
}

viewDatabase();