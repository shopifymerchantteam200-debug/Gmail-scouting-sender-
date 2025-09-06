# Gmail Scouting Sender

A private web app to send scouting emails through your Gmail account.

## How to run

1. Add your Google OAuth credentials in a `.env` file:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   OAUTH_REDIRECT_URI=https://your-app-url/oauth2callback
   SESSION_SECRET=mysecret123
   DATA_FILE=./data.json
   ```

2. In terminal:
   ```
   cd server
   npm install
   npm start
   ```

3. Open your app in browser and connect Gmail.
