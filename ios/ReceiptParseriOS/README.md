# ReceiptParser iOS

This folder contains the native SwiftUI iPhone client for Receipt Parser.

## Project generation

The repo includes an `xcodegen` spec at `project.yml` rather than a committed `.xcodeproj`.

1. Install `xcodegen`
2. Run `xcodegen generate` from this directory
3. Open `ReceiptParseriOS.xcodeproj`
4. Set your development team in Xcode

## Local development flow

For the fastest device testing path:

1. Start the backend from the repo root:
   ```bash
   cd backend
   npm start
   ```
2. Expose the backend with ngrok:
   ```bash
   ngrok http 5002
   ```
3. Copy the forwarding URL and use `https://your-ngrok-url/api` in the app's backend URL field
4. Tap `Save Backend URL`
5. Tap `Continue Locally`

## Notes

- The app is iPhone-first
- Local testing can bypass full auth via the backend development login route
- Production auth paths are Sign in with Apple and email/password
- Session tokens are stored in Keychain
- Receipt upload uses the new backend multipart endpoint
- Receipt edits are local to the active session in v1
