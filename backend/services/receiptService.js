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
        
        // Try multiple field names for tax amount
        let taxAmount = receipt.fields.TaxAmount?.value || 
                       receipt.fields.Tax?.value || 
                       receipt.fields.TotalTax?.value ||
                       receipt.fields.SalesTax?.value ||
                       receipt.fields.VAT?.value ||
                       null;
        
        console.log('Extracted tax amount:', taxAmount);
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
        
        // Calculate proper subtotal and tax relationship
        let finalTaxAmount = taxAmount;
        let finalSubtotal = subtotal;
        let finalTotal = receiptTotal;
        
        // Priority 1: If we have BOTH explicit subtotal AND tax from Azure, use them and calculate total
        if (finalSubtotal && finalTaxAmount) {
            finalTotal = Math.round((finalSubtotal + finalTaxAmount) * 100) / 100;
            console.log(`Using explicit subtotal: ${finalSubtotal} and tax: ${finalTaxAmount}, calculated total: ${finalTotal}`);
        }
        // Priority 2: If we have explicit total and tax, calculate subtotal
        else if (finalTaxAmount && receiptTotal > 0) {
            finalSubtotal = Math.round((receiptTotal - finalTaxAmount) * 100) / 100;
            finalTotal = receiptTotal;
            console.log(`Using explicit tax: ${finalTaxAmount} and total: ${finalTotal}, calculated subtotal: ${finalSubtotal}`);
        }
        // Priority 3: If we have explicit total and subtotal, calculate tax
        else if (finalSubtotal && receiptTotal > 0) {
            finalTaxAmount = Math.round((receiptTotal - finalSubtotal) * 100) / 100;
            finalTotal = receiptTotal;
            console.log(`Using explicit subtotal: ${finalSubtotal} and total: ${finalTotal}, calculated tax: ${finalTaxAmount}`);
        }
        // If we don't have total but have subtotal/tax, calculate it
        else if (!finalTotal && finalSubtotal && finalTaxAmount) {
            finalTotal = Math.round((finalSubtotal + finalTaxAmount) * 100) / 100;
            console.log(`No explicit total, calculated from subtotal + tax: ${finalTotal}`);
        }
        // If we only have one value, try to infer the others from item total
        else if (receiptTotal > 0 && total > 0 && Math.abs(total - receiptTotal) > 0.01) {
            const difference = receiptTotal - total;
            console.warn(`Total mismatch: items=${total}, receipt=${receiptTotal}, difference=${difference.toFixed(2)}`);
            
            // If the difference is positive and reasonable, assume it's tax
            if (difference > 0 && difference < total * 0.5) {
                finalTaxAmount = Math.round(difference * 100) / 100;
                finalSubtotal = Math.round(total * 100) / 100;
                finalTotal = receiptTotal;
                console.log(`Inferred from difference - subtotal: ${finalSubtotal}, tax: ${finalTaxAmount}, total: ${finalTotal}`);
            }
        }
        // Try common tax rates if still no complete values
        else if (!finalTotal && total > 0) {
            // Use item total as baseline
            finalSubtotal = Math.round(total * 100) / 100;
            finalTotal = receiptTotal || total;
            if (!finalTaxAmount && finalTotal > finalSubtotal) {
                finalTaxAmount = Math.round((finalTotal - finalSubtotal) * 100) / 100;
                console.log(`Using item total as subtotal: ${finalSubtotal}, calculated tax: ${finalTaxAmount}`);
            }
        }
        
        // Validate the relationship: subtotal + tax should equal total (within 1 cent)
        if (finalSubtotal && finalTaxAmount) {
            const calculatedTotal = finalSubtotal + finalTaxAmount;
            if (Math.abs(calculatedTotal - finalTotal) > 0.01) {
                console.warn(`Subtotal + Tax (${calculatedTotal.toFixed(2)}) doesn't match Total (${finalTotal.toFixed(2)})`);
            }
        }

        return { 
            merchantName, 
            transactionDate, 
            total: finalTotal, 
            subtotal: finalSubtotal,
            taxAmount: finalTaxAmount,
            items 
        };
    } catch (error) {
        console.error('Azure document analysis failed:', error);
        throw new Error(`Azure analysis failed: ${error.message}`);
    }
};

const saveReceipt = async (receiptData, userId = null) => {
    try {
        // Validate receipt data before saving
        if (!receiptData || typeof receiptData !== 'object') {
            throw new Error('Invalid receipt data provided');
        }

        const { merchantName, transactionDate, total, subtotal, taxAmount, items } = receiptData;

        // Validate required fields
        if (!merchantName || typeof merchantName !== 'string' || merchantName.trim().length === 0) {
            throw new Error('Missing or invalid merchant name');
        }

        if (!transactionDate) {
            throw new Error('Missing transaction date');
        }

        if (typeof total !== 'number' || total < 0) {
            throw new Error('Invalid total amount');
        }

        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }

        // Validate user ID
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid user ID provided');
        }

        // Sanitize and validate merchant name
        const sanitizedMerchantName = merchantName.trim().substring(0, 200); // Limit length
        
        // Validate amounts
        const validatedTotal = Math.round(total * 100) / 100;
        const validatedSubtotal = subtotal ? Math.round(subtotal * 100) / 100 : null;
        const validatedTaxAmount = taxAmount ? Math.round(taxAmount * 100) / 100 : null;
        
        // Validate and sanitize items
        const validatedItems = items
            .filter(item => item !== null && typeof item === 'object')
            .map(item => ({
                description: (item.description || '').toString().trim().substring(0, 200),
                quantity: Math.max(0, parseFloat(item.quantity) || 0),
                price: Math.max(0, parseFloat(item.price) || 0),
                totalPrice: Math.max(0, parseFloat(item.totalPrice) || 0),
                isWeighted: Boolean(item.isWeighted)
            }))
            .filter(item => item.description.length > 0 || item.totalPrice > 0);

        const receiptDoc = {
            type: 'receipt',
            name: sanitizedMerchantName,
            date: transactionDate,
            total: validatedTotal,
            subtotal: validatedSubtotal,
            taxAmount: validatedTaxAmount,
            items: validatedItems,
            userId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('Saving receipt to database:', { 
            merchant: receiptDoc.name, 
            total: receiptDoc.total, 
            itemCount: receiptDoc.items.length,
            userId 
        });
        
        const doc = await db.insert(receiptDoc);
        
        // Map _id to id for frontend compatibility and remove internal fields
        const { _id, type, ...publicFields } = doc;
        return { id: _id, ...publicFields };
    } catch (error) {
        console.error('Failed to save receipt:', error);
        throw new Error(`Database save failed: ${error.message}`);
    }
};

const getReceipts = async (userId = null, options = {}) => {
    try {
        console.log('Fetching receipts from database...');
        
        // Require userId for security
        if (!userId) {
            throw new Error('Authentication required - no user ID provided');
        }
        
        // Validate userId format (should be a non-empty string)
        if (typeof userId !== 'string' || userId.trim().length === 0) {
            throw new Error('Invalid user ID format');
        }
        
        // Extract pagination options
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = options;
        const skip = (page - 1) * limit;
        
        // Build query to get only the user's receipts
        const query = { 
            type: 'receipt',
            userId: userId
        };
        
        // Get total count for pagination
        const total = await db.count(query);
        
        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;
        
        // Fetch receipts with pagination
        const docs = await db.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        
        console.log(`Found ${docs.length} receipts (page ${page}/${Math.ceil(total / limit)}) for user ${userId}`);
        
        // Map _id to id for frontend compatibility and remove internal fields
        const receipts = docs.map(doc => {
            const { _id, type, ...publicFields } = doc;
            return { id: _id, ...publicFields };
        });
        
        return {
            data: receipts,
            total,
            page,
            limit
        };
    } catch (error) {
        console.error('Failed to fetch receipts:', error);
        throw new Error(`Database fetch failed: ${error.message}`);
    }
};

const deleteReceipt = async (id, userId = null) => {
    try {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid receipt ID provided');
        }

        console.log('Deleting receipt with ID:', id);
        
        // Require userId for security
        if (!userId) {
            throw new Error('Authentication required - no user ID provided');
        }
        
        // Validate userId format
        if (typeof userId !== 'string' || userId.trim().length === 0) {
            throw new Error('Invalid user ID format');
        }
        
        // Build query - always require userId for security
        const query = { _id: id, type: 'receipt', userId: userId };
        
        // First check if the receipt exists and user has permission
        const existingReceipt = await db.findOne(query);
        if (!existingReceipt) {
            return false; // Receipt not found or user doesn't have permission
        }

        // Delete the receipt
        const deleteResult = await db.remove(query, {});
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
