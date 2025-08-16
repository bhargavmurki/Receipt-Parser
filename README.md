# Receipt Parser

A smart receipt analysis and bill splitting application that uses Azure Form Recognizer to extract data from receipt images and provides an intuitive interface for managing and splitting expenses.

## Features

- **Receipt Upload & Analysis**: Upload receipt images and automatically extract item details, prices, and totals using Azure AI
- **Smart Data Extraction**: Leverages Azure Form Recognizer for accurate text and data extraction from receipts
- **Bill Splitting**: Split receipt items among multiple people for easy expense sharing
- **Receipt Management**: View, manage, and delete processed receipts
- **Real-time Processing**: Fast receipt processing with immediate feedback
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Axios** - HTTP client for API communication
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js & Express** - RESTful API server
- **Azure Form Recognizer** - AI-powered document analysis
- **NeDB** - Local database for data storage
- **UUID** - Unique identifier generation

## Project Structure

```
receipt-parser/
├── src/                    # React frontend
│   ├── components/         # React components
│   │   ├── UploadReceipt.js    # Receipt upload interface
│   │   ├── ReceiptList.js      # Display all receipts
│   │   ├── ReceiptDisplay.js   # Individual receipt view
│   │   ├── SplitItems.js       # Bill splitting functionality
│   │   ├── ConfirmModal.js     # Confirmation dialogs
│   │   └── Loading.js          # Loading component
│   └── App.js             # Main application component
├── backend/               # Node.js backend
│   ├── config/            # Configuration files
│   │   ├── azureClient.js      # Azure Form Recognizer setup
│   │   └── config.js           # Environment configuration
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── models/           # Data models & NeDB setup
│   │   ├── db.js              # NeDB database connection
│   │   └── receipts.db        # Local database file
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   │   ├── admin-server.js     # Admin web interface
│   │   └── view-db.js          # Database viewer script
│   └── utils/            # Utility functions
└── package.json          # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Azure Form Recognizer account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd receipt-parser
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Azure Form Recognizer
   AZURE_ENDPOINT=your_azure_endpoint
   AZURE_API_KEY=your_azure_key
   
   # Server Configuration
   PORT=5002
   ```

4. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd backend
   npm start
   ```
   
   Terminal 2 (Frontend):
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

## Usage

1. **Upload a Receipt**: Click the upload area or drag and drop a receipt image
2. **Processing**: The app will automatically process the image using Azure AI
3. **Review Data**: Check the extracted items, prices, and total
4. **Split Bill**: Use the splitting feature to divide costs among multiple people
5. **Manage Receipts**: View all processed receipts in the dashboard

### Admin Interface

Access the database admin interface to manage receipts:
1. Start the admin server: `node backend/scripts/admin-server.js`
2. Visit `http://localhost:3001`
3. Click "Load Receipts" to view all stored receipts
4. Delete receipts directly from the interface

## API Endpoints

- `POST /receipts` - Upload and process a new receipt
- `GET /receipts` - Retrieve all processed receipts  
- `DELETE /receipts/:id` - Delete a specific receipt

## Configuration

The application supports various configuration options:

- **Azure Form Recognizer**: Required for receipt text extraction
- **Local Database**: NeDB for data storage and management

## Development

### Available Scripts

**Frontend:**
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production

**Backend:**
- `npm start` - Start the API server
- `node scripts/view-db.js` - View local database contents
- `node scripts/admin-server.js` - Start admin interface (http://localhost:3001)

### Building for Production

```bash
# Build frontend
npm run build

# The build folder will contain the production-ready files
```

## Troubleshooting

- **Azure API Issues**: Verify your Azure Form Recognizer credentials and endpoint
- **CORS Errors**: Ensure the backend server is running on the correct port
- **Image Upload Fails**: Check image format (supports JPEG, PNG, GIF, BMP)
- **Node.js Issues**: Try using the `--openssl-legacy-provider` flag for older Node versions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the repository.