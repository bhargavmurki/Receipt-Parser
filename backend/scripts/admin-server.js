const express = require('express');
const db = require('../models/db');

const app = express();
app.use(express.json());

// Simple HTML interface
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head><title>Receipt Database Admin</title></head>
        <body style="font-family: Arial;">
            <h1>Receipt Database Admin</h1>
            <button onclick="loadReceipts()">Load Receipts</button>
            <div id="receipts"></div>
            
            <script>
            async function loadReceipts() {
                const response = await fetch('/api/receipts');
                const receipts = await response.json();
                
                const html = receipts.map(r => \`
                    <div style="border: 1px solid #ccc; margin: 10px; padding: 10px;">
                        <h3>\${r.name} - $\${r.total}</h3>
                        <p>Date: \${new Date(r.date).toLocaleDateString()}</p>
                        \${r.subtotal ? \`<p>Subtotal: $\${r.subtotal}</p>\` : ''}
                        \${r.taxAmount ? \`<p>Tax: $\${r.taxAmount}</p>\` : ''}
                        <p>Items: \${r.items?.length || 0}</p>
                        <details>
                            <summary>Show Items</summary>
                            \${r.items?.map(item => \`<li>\${item.description} - $\${item.totalPrice}</li>\`).join('') || 'No items'}
                        </details>
                        <button onclick="deleteReceipt('\${r._id}')">Delete</button>
                    </div>
                \`).join('');
                
                document.getElementById('receipts').innerHTML = html;
            }
            
            async function deleteReceipt(id) {
                if(confirm('Delete this receipt?')) {
                    await fetch(\`/api/receipts/\${id}\`, {method: 'DELETE'});
                    loadReceipts();
                }
            }
            </script>
        </body>
        </html>
    `);
});

// API endpoints
app.get('/api/receipts', async (req, res) => {
    try {
        const receipts = await db.find({ type: 'receipt' }).sort({ createdAt: -1 });
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/receipts/:id', async (req, res) => {
    try {
        const result = await db.remove({ _id: req.params.id, type: 'receipt' });
        res.json({ success: true, deletedCount: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Database admin interface running at http://localhost:${PORT}`);
});