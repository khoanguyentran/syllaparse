export const GOOGLE_CONFIG = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '',
};

export const GOOGLE_CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
];
