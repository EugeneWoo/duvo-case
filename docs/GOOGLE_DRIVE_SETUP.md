# Google Drive Upload Setup

To enable the "Google Drive" export option in the download dropdown, you need to set up Google OAuth credentials.

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "Credentials" in the left sidebar
2. Click "Create Credentials" → "OAuth Client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5173/oauth-callback`
   - `http://localhost:5174/oauth-callback` (if port increments)
   - Add any other localhost ports you use
5. Copy the Client ID

### 3. Configure Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. Edit `frontend/.env.local` and paste your Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

3. Restart the frontend dev server

## Usage

1. Click the "Download" button in the chat interface
2. Select "Google Drive (.md)"
3. You'll be prompted to log in with your Google account
4. Grant permission to upload files to Google Drive
5. The markdown file will be uploaded to your Google Drive

## Troubleshooting

- **"Client ID not configured"**: Make sure `VITE_GOOGLE_CLIENT_ID` is set in `frontend/.env.local`
- **"Popup blocked"**: Allow popups for this site in your browser
- **"Authentication timeout"**: Check your internet connection and try again
- **"Token expired"**: You'll be prompted to log in again automatically
