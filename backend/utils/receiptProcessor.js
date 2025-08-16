const util = require('util');

function processReceiptItems(receiptItems) {
    if (!Array.isArray(receiptItems)) {
        console.warn('receiptItems is not an array:', receiptItems);
        return [];
    }

    console.log(`Processing ${receiptItems.length} receipt items...`);
    
    return receiptItems.map((item, index) => {
        try {
            let quantity = item.properties?.Quantity?.value ?? 0;
            let price = item.properties?.Price?.value ?? 0;
            let totalPrice = item.properties?.TotalPrice?.value ?? 0;
            let description = item.properties?.Description?.value?.trim() ?? '';

            if (!description) {
                description = `Item ${index + 1}${totalPrice ? ` ($${totalPrice.toFixed(2)})` : ''}`;
            }

            const weightMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:lb|LB|oz|OZ|G|g)/i);
            let isWeighted = !!weightMatch;

            if (isWeighted) {
                quantity = parseFloat(weightMatch[1]);
                if (price === 0 && totalPrice !== 0) {
                    price = totalPrice / quantity;
                }
            }

            const qtyMatch = description.match(/(\d+)P$/);
            if (qtyMatch) {
                quantity = parseInt(qtyMatch[1]);
                isWeighted = false;
            }

            const perUnitMatch = description.match(/(\d+(?:\.\d+)?)\s*@\s*(\d+(?:\.\d+)?)/);
            if (perUnitMatch) {
                quantity = parseFloat(perUnitMatch[1]);
                price = parseFloat(perUnitMatch[2]);
            }

            if (totalPrice > 100 && quantity <= 10) {
                totalPrice /= 100;
            }

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

            if (description.toUpperCase() === 'TAX' || description.toUpperCase() === 'GROCERY') {
                quantity = 1;
                price = totalPrice;
            }

            if (Math.abs(totalPrice - (quantity * price)) > 0.01) {
                // console.warn(`Price mismatch for item ${index}: TotalPrice=${totalPrice}, Quantity=${quantity}, Price=${price}`);
            }

            // Final validation and cleanup
            const finalItem = {
                description: description.trim(),
                quantity: isNaN(quantity) ? 1 : Math.max(0, quantity),
                price: isNaN(price) ? 0 : Math.max(0, price),
                totalPrice: isNaN(totalPrice) ? 0 : Math.max(0, totalPrice),
                isWeighted
            };

            // Ensure at least some meaningful data exists
            if (finalItem.description === '' && finalItem.totalPrice === 0) {
                console.warn(`Skipping empty item at index ${index}`);
                return null;
            }

            return finalItem;
        } catch (error) {
            console.error(`Error processing item ${index}:`, util.inspect(item, { showHidden: false, depth: null, colors: true }), error);
            return null;
        }
    }).filter(item => item !== null);
}

module.exports = { processReceiptItems };
