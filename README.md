# Receipt Parser

Receipt Parser extracts receipt data with Azure AI and helps split items across people. This repo includes:

- a React web app in [`src`](src)
- a Node/Express backend in [`backend`](backend)
- a native SwiftUI iPhone app in [`ios/ReceiptParseriOS`](ios/ReceiptParseriOS)

## Local Setup

### Prerequisites

- Node.js 16+
- npm
- Azure Form Recognizer credentials
- Xcode + `xcodegen` for the iPhone app
- `ngrok` for physical iPhone testing

### Backend

1. Install dependencies:
   ```bash
   npm install
   cd backend && npm install
   ```

2. Create `backend/.env` from [`backend/.env.example`](backend/.env.example).

3. Minimum development config:
   ```env
   AZURE_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
   AZURE_API_KEY=your-azure-form-recognizer-api-key
   PORT=5002
   NODE_ENV=development
   ENABLE_DEV_LOGIN=true
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5002
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   TRUST_PROXY=1
   ```

4. Start the backend:
   ```bash
   cd backend
   npm start
   ```

Health check:
```bash
curl http://localhost:5002/health
```

### Web App

Start the React app from the repo root:

```bash
npm start
```

The web app runs at `http://localhost:3000`.

### iPhone App

The iPhone app is XcodeGen-based.

1. Generate the project:
   ```bash
   cd ios/ReceiptParseriOS
   xcodegen generate
   ```
2. Open `ReceiptParseriOS.xcodeproj`
3. Set your development team in Xcode
4. Build to a simulator or physical iPhone

For physical iPhone testing, use ngrok:

```bash
ngrok http 5002
```

Then in the app:

1. set Backend URL to `https://your-ngrok-url/api`
2. tap `Save Backend URL`
3. tap `Continue Locally`

`Continue Locally` uses the development-only endpoint `POST /api/auth/dev-login`. Enable it explicitly with `ENABLE_DEV_LOGIN=true` in `backend/.env`.

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/dev-login`
- `POST /api/auth/apple`
- `GET /api/auth/verify`
- `GET /api/auth/profile`
- `POST /api/process-receipt`
- `POST /api/receipts/upload`
- `GET /api/receipts`
- `DELETE /api/receipts/:id`
- `GET /health`

## Notes

- Web uploads use the legacy base64 receipt endpoint.
- iPhone uploads use multipart form-data.
- Sign in with Apple backend support is present, but local device testing can bypass full auth with `Continue Locally`.
- Tokens are stored in Keychain on iPhone.

More iPhone-specific notes live in [`ios/ReceiptParseriOS/README.md`](ios/ReceiptParseriOS/README.md).
