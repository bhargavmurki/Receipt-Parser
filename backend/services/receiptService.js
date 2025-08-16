const azureClient = require('../config/azureClient');
const db = require('../models/db');
const { processReceiptItems } = require('../utils/receiptProcessor');
const util = require('util');

const analyzeReceipt = async (buffer) => {
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('Invalid buffer provided to Azure client');
        }

        console.log('Starting Azure document analysis...');
        const poller = await azureClient.beginAnalyzeDocument("prebuilt-receipt", buffer);
        const result = await poller.pollUntilDone();
        
        if (!result || !result.documents || result.documents.length === 0) {
            throw new Error('No receipt document found in the analysis result');
        }
        
        const receipt = result.documents[0];

        if (!receipt || !receipt.fields) {
            console.error('Receipt or receipt fields are null:', util.inspect(receipt, { showHidden: false, depth: null, colors: true }));
            throw new Error('Failed to extract receipt data from document');
        }

        console.log('Available receipt fields:', Object.keys(receipt.fields));
        console.log('Full receipt fields:', util.inspect(receipt.fields, { showHidden: false, depth: 2, colors: true }));

        const merchantName = receipt.fields.MerchantName?.value ?? 'Unknown Merchant';
        const transactionDate = receipt.fields.TransactionDate?.value ?? new Date().toISOString().split('T')[0];
        const subtotal = receipt.fields.Subtotal?.value || null;
        const taxAmount = receipt.fields.TaxAmount?.value || receipt.fields.Tax?.value || null;
        let items = [];

        if (receipt.fields.Items && Array.isArray(receipt.fields.Items.values)) {
            items = processReceiptItems(receipt.fields.Items.values);
            console.log(`Processed ${items.length} items from receipt`);
        } else {
            console.warn('No Items field found in the receipt');
        }

        const calculatedTotal = items.reduce((sum, item) => sum + (item?.totalPrice || 0), 0);
        const total = Math.round(calculatedTotal * 100) / 100;

        const receiptTotal = receipt.fields.Total?.value || 0;
        
        // If no explicit tax amount found, try to calculate from total mismatch
        let finalTaxAmount = taxAmount;
        let finalSubtotal = subtotal;
        
        if (!finalTaxAmount && Math.abs(total - receiptTotal) > 0.01 && receiptTotal > 0) {
            const difference = receiptTotal - total;
            console.warn(`Total mismatch: calculated ${total}, receipt says ${receiptTotal}, difference: ${difference.toFixed(2)}`);
            
            // If the difference is positive and reasonable (less than 50% of subtotal), assume it's tax
            if (difference > 0 && difference < total * 0.5) {
                finalTaxAmount = Math.round(difference * 100) / 100;
                finalSubtotal = total;
                console.log(`Inferred tax amount: ${finalTaxAmount}, subtotal: ${finalSubtotal}`);
            }
        }

        return { 
            merchantName, 
            transactionDate, 
            total: receiptTotal || total, 
            subtotal: finalSubtotal,
            taxAmount: finalTaxAmount,
            items 
        };
    } catch (error) {
        console.error('Azure document analysis failed:', error);
        throw new Error(`Azure analysis failed: ${error.message}`);
    }
};

const saveReceipt = async (receiptData) => {
    try {
        // Validate receipt data before saving
        if (!receiptData || typeof receiptData !== 'object') {
            throw new Error('Invalid receipt data provided');
        }

        const { merchantName, transactionDate, total, subtotal, taxAmount, items } = receiptData;

        if (!merchantName || !transactionDate) {
            throw new Error('Missing required receipt fields: merchantName or transactionDate');
        }

        if (typeof total !== 'number' || total < 0) {
            throw new Error('Invalid total amount');
        }

        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }

        const receiptDoc = {
            type: 'receipt',
            name: merchantName.trim(),
            date: transactionDate,
            total: Math.round(total * 100) / 100, // Ensure proper decimal precision
            subtotal: subtotal ? Math.round(subtotal * 100) / 100 : null,
            taxAmount: taxAmount ? Math.round(taxAmount * 100) / 100 : null,
            items: items.filter(item => item !== null), // Remove any null items
            createdAt: new Date().toISOString()
        };

        console.log('Saving receipt to database:', receiptDoc.name);
        const doc = await db.insert(receiptDoc);
        
        // Map _id to id for frontend compatibility and remove internal fields
        const { _id, type, createdAt, updatedAt, ...publicFields } = doc;
        return { id: _id, ...publicFields };
    } catch (error) {
        console.error('Failed to save receipt:', error);
        throw new Error(`Database save failed: ${error.message}`);
    }
};

const getReceipts = async () => {
    try {
        console.log('Fetching receipts from database...');
        const docs = await db.find({ type: 'receipt' })
            .sort({ createdAt: -1, date: -1 })
            .limit(50);
        
        console.log(`Found ${docs.length} receipts`);
        
        // Map _id to id for frontend compatibility and remove internal fields
        return docs.map(doc => {
            const { _id, type, createdAt, updatedAt, ...publicFields } = doc;
            return { id: _id, ...publicFields };
        });
    } catch (error) {
        console.error('Failed to fetch receipts:', error);
        throw new Error(`Database fetch failed: ${error.message}`);
    }
};

const deleteReceipt = async (id) => {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid receipt ID provided');
        }

        console.log('Deleting receipt with ID:', id);
        
        // First check if the receipt exists
        const existingReceipt = await db.findOne({ _id: id, type: 'receipt' });
        if (!existingReceipt) {
            return false; // Receipt not found
        }

        // Delete the receipt
        const deleteResult = await db.remove({ _id: id }, {});
        console.log(`Deleted ${deleteResult} receipt(s)`);
        
        return deleteResult > 0;
    } catch (error) {
        console.error('Failed to delete receipt:', error);
        throw new Error(`Database delete failed: ${error.message}`);
    }
};

module.exports = {
    analyzeReceipt,
    saveReceipt,
    getReceipts,
    deleteReceipt
};
