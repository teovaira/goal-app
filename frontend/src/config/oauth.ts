// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE';

// Instructions for setting up Google OAuth:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable Google+ API
// 4. Create OAuth 2.0 credentials
// 5. Add http://localhost:5173 to Authorized JavaScript origins
// 6. Add http://localhost:5173/login and http://localhost:5173/register to Authorized redirect URIs
// 7. Copy your Client ID and add it to your .env file as VITE_GOOGLE_CLIENT_ID