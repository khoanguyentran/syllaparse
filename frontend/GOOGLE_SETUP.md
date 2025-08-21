# Google OAuth & Calendar Integration Setup

This guide will help you set up Google OAuth authentication and Google Calendar integration for the Syllaparse application.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Syllaparse"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Add test users if you're in testing mode

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)
5. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain (when deployed)
6. Copy the Client ID

## Step 4: Create API Key (Optional)

1. In the same Credentials page, click "Create Credentials" > "API Key"
2. Copy the API Key
3. Restrict the API key to Google Calendar API only for security

## Step 5: Environment Configuration

Create a `.env.local` file in your `frontend` directory with:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key_here
```

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the application
3. Click the "Sign in with Google" button
4. Complete the OAuth flow
5. Check that your calendar events are loading

## Troubleshooting

### Common Issues:

1. **"Google OAuth not configured" error**
   - Make sure your `.env.local` file exists and has the correct values
   - Restart your development server after adding environment variables

2. **"Failed to initialize Google client" error**
   - Check that your Client ID is correct
   - Verify that the Google Calendar API is enabled
   - Ensure your OAuth consent screen is properly configured

3. **"Calendar not accessible" error**
   - Make sure you've granted calendar permissions during OAuth
   - Check that the required scopes are added to your OAuth consent screen

4. **CORS errors**
   - Verify your authorized origins and redirect URIs are correct
   - Make sure you're using the exact domain (including protocol and port)

### Security Notes:

- Never commit your `.env.local` file to version control
- Restrict your API key to only the necessary APIs
- Use test users during development to avoid affecting production data
- Regularly review and rotate your credentials

## Production Deployment

When deploying to production:

1. Update your OAuth consent screen with production information
2. Add your production domain to authorized origins and redirect URIs
3. Remove test users and publish your app
4. Update environment variables in your hosting platform
5. Consider using environment-specific OAuth client IDs

## Additional Features

The Google integration includes:

- **User Authentication**: Sign in with Google account
- **Calendar Access**: View upcoming calendar events
- **Assignment Sync**: Add assignments directly to Google Calendar
- **Smart Reminders**: Automatic reminder setup for assignments
- **Event Management**: View and manage calendar events

For more information, visit the [Google Calendar API documentation](https://developers.google.com/calendar).
