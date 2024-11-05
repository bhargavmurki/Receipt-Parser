const express = require('express');
const bodyParser = require('body-parser');
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const dotenv = require('dotenv');
const util = require('util');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Azure Form Recognizer setup using environment variables
const client = new DocumentAnalysisClient(
    process.env.AZURE_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_API_KEY)
);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Helper function to process receipt items
function processReceiptItems(receiptItems) {
    console.log('Processing receipt items:', util.inspect(receiptItems, { showHidden: false, depth: null, colors: true }));
    
    return receiptItems.map((item, index) => {
        // console.log(`Processing item ${index}:`, util.inspect(item, { showHidden: false, depth: null, colors: true }));
        
        try {
            let quantity = item.properties?.Quantity?.value ?? 0;
            let price = item.properties?.Price?.value ?? 0;
            let totalPrice = item.properties?.TotalPrice?.value ?? 0;
            let description = item.properties?.Description?.value?.trim() ?? '';

            // Handle empty or null descriptions
            if (!description) {
                description = `Item ${index + 1}${totalPrice ? ` ($${totalPrice.toFixed(2)})` : ''}`;
            }

            // Handle weighted items
            const weightMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:lb|LB|oz|OZ|G|g)/i);
            let isWeighted = !!weightMatch;

            if (isWeighted) {
                quantity = parseFloat(weightMatch[1]);
                if (price === 0 && totalPrice !== 0) {
                    price = totalPrice / quantity;
                }
            }

            // Handle items with quantity in the description
            const qtyMatch = description.match(/(\d+)P$/);
            if (qtyMatch) {
                quantity = parseInt(qtyMatch[1]);
                isWeighted = false;
            }

            // Handle per-unit pricing
            const perUnitMatch = description.match(/(\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)/);
            if (perUnitMatch) {
                quantity = parseFloat(perUnitMatch[1]);
                price = parseFloat(perUnitMatch[2]);
            }

            // Correct misinterpretation of cents as dollars
            if (totalPrice > 100 && quantity <= 10) {
                totalPrice /= 100;
            }

            // Infer missing values
            if (totalPrice !== 0 && (quantity === 0 || price === 0)) {
                if (quantity === 0 && price !== 0) {
                    quantity = totalPrice / price;
                } else if (price === 0 && quantity !== 0) {
                    price = totalPrice / quantity;
                } else {
                    quantity = 1;
                    price = totalPrice;
                }
            }

            // Handle special cases like TAX and GROCERY
            if (description.toUpperCase() === 'TAX' || description.toUpperCase() === 'GROCERY') {
                quantity = 1;
                price = totalPrice;
            }

            // Ensure totalPrice is consistent with quantity and price
            if (Math.abs(totalPrice - (quantity * price)) > 0.01) {
                totalPrice = quantity * price;
            }

            // Round values to 2 decimal places
            quantity = Math.round(quantity * 100) / 100;
            price = Math.round(price * 100) / 100;
            totalPrice = Math.round(totalPrice * 100) / 100;

            // console.log(`Processed item ${index}:`, { description, quantity, price, totalPrice, isWeighted });
            
            return {
                description,
                quantity,
                price,
                totalPrice,
                isWeighted
            };
        } catch (error) {
            console.error(`Error processing item ${index}:`, error);
            return null; // Return null for items that couldn't be processed
        }
    }).filter(item => item !== null && (item.totalPrice > 0 || item.description.toUpperCase() === 'TAX'));
}

// Routes


app.post('/process-receipt', async (req, res) => {
    console.log('Received request to process receipt');

    if (!req.body.image) {
        return res.status(400).send({ error: 'No image data received' });
    }

    const base64Image = req.body.image;
    const buffer = Buffer.from(base64Image, 'base64');

    console.log("Try one")
    try {
        const poller = await client.beginAnalyzeDocument("prebuilt-receipt", buffer);
        const result = await poller.pollUntilDone();
        console.log("Try two")

        console.log('Analysis result:', util.inspect(result, { showHidden: false, depth: null, colors: true }));

        if (!result) {
            console.error('Result is null or undefined');
            return res.status(500).send({ error: 'Document analysis failed: null result' });
        }

        if (result.status === 'failed') {
            console.error('Failed to analyze document:', util.inspect(result, { showHidden: false, depth: null, colors: true }));
            return res.status(500).send({ error: 'Document analysis failed.' });
        }

        if (!result.documents || result.documents.length === 0) {
            console.error('No documents found in the result:', util.inspect(result, { showHidden: false, depth: null, colors: true }));
            return res.status(400).send({ error: 'No receipt data found or documents array is empty.' });
        }

        const receipt = result.documents[0];
        console.log('Receipt document:', util.inspect(receipt, { showHidden: false, depth: null, colors: true }));

        if (!receipt || !receipt.fields) {
            console.error('Receipt or receipt fields are null:', util.inspect(receipt, { showHidden: false, depth: null, colors: true }));
            return res.status(400).send({ error: 'Invalid receipt data structure.' });
        }

        const merchantName = receipt.fields?.MerchantName?.value || 'Unknown Merchant';
        const transactionDate = receipt.fields?.TransactionDate?.value || new Date();
        let total = receipt.fields?.Total?.value || 0;

        console.log('MerchantName:', merchantName);
        console.log('TransactionDate:', transactionDate);
        console.log('Total:', total);

        let items = [];
        if (receipt.fields?.Items?.values) {
            console.log('Items field:', util.inspect(receipt.fields.Items, { showHidden: false, depth: null, colors: true }));
            if (Array.isArray(receipt.fields.Items.values)) {
                items = processReceiptItems(receipt.fields.Items.values);
            } else {
                console.warn('Items.values is not an array:', typeof receipt.fields.Items.values);
            }
        } else {
            console.warn('No Items field found in the receipt');
        }

        // console.log('Processed items:', util.inspect(items, { showHidden: false, depth: null, colors: true }));

        // Safeguard against null items
        if (!items || items.length === 0) {
            console.warn('No items processed or items array is empty');
            items = [];
        }

        const calculatedTotal = items.reduce((sum, item) => sum + (item?.totalPrice || 0), 0);
        total = Math.round(calculatedTotal * 100) / 100;

        console.log('Calculated total:', total);

        const { data, error } = await supabase
            .from('receipts')
            .insert([{
                type: 'receipt',
                name: merchantName,
                date: transactionDate,
                total: total,
                items: items
            }]);

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn('No data returned from Supabase insert');
            return res.status(200).send({ message: 'Receipt processed, but no data returned' });
        }

        res.status(200).send(data[0]);
    } catch (error) {
        console.error('Error processing receipt:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send({ error: `Failed to process the receipt: ${error.message}` });
    }
});



app.get('/receipts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .order('date', { ascending: false })
            .limit(20);

        if (error) throw error;

        res.status(200).send(data);
    } catch (error) {
        console.error('Error fetching receipts:', error.message);
        res.status(500).send({ error: 'Failed to fetch receipts' });
    }
});

app.delete('/receipts/:id', async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
        return res.status(400).send({ error: 'Invalid receipt ID.' });
    }

    try {
        const { error } = await supabase
            .from('receipts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.status(200).send({ message: 'Receipt deleted successfully' });
    } catch (error) {
        console.error('Error deleting receipt:', error);
        res.status(500).send({ error: 'Failed to delete receipt' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific logging, throwing an error, or other logic here
});