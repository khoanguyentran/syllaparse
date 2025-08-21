'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, User, LogOut, Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { GOOGLE_CONFIG, GOOGLE_CALENDAR_SCOPES } from '@/config/google'

interface GoogleUser {
    id: string
    name: string
    email: string
    picture: string
}

interface CalendarEvent {
    id: string
    summary: string
    start: {
        dateTime?: string
        date?: string
    }
    end: {
        dateTime?: string
        date?: string
    }
}

declare global {
    interface Window {
        google: any
    }
}

export default function GoogleSignIn() {
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [user, setUser] = useState<GoogleUser | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [calendarConnected, setCalendarConnected] = useState(false)
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
    const [error, setError] = useState<string | null>(null)
    const [tokenClient, setTokenClient] = useState<any>(null)

    // Initialize Google API
    useEffect(() => {
        const loadGoogleAPI = async () => {
            try {
                // Load Google Identity Services script
                const script = document.createElement('script')
                script.src = 'https://accounts.google.com/gsi/client'
                script.async = true
                script.defer = true
                script.onload = () => {
                    if (window.google) {
                        initializeGoogleAPI()
                    }
                }
                document.head.appendChild(script)
            } catch (err) {
                setError('Failed to load Google API')
                console.error('Error loading Google API:', err)
            }
        }

        loadGoogleAPI()
    }, [])

    const initializeGoogleAPI = useCallback(async () => {
        try {
            if (!window.google) {
                throw new Error('Google API not loaded')
            }

            // Initialize the token client
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CONFIG.clientId,
                scope: GOOGLE_CONFIG.scope,
                callback: handleTokenResponse,
            })

            setTokenClient(client)

            // Check if user is already signed in
            checkSignInStatus()
        } catch (err) {
            setError('Failed to initialize Google client')
            console.error('Error initializing Google client:', err)
        }
    }, [])

    const handleTokenResponse = useCallback(async (response: any) => {
        if (response.error) {
            setError('Failed to sign in')
            console.error('Sign in error:', response.error)
            return
        }

        try {
            // Get user info
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    'Authorization': `Bearer ${response.access_token}`
                }
            })
            const userData = await userInfo.json()

            setUser({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                picture: userData.picture,
            })

            setIsSignedIn(true)
            setError(null)

            // Check calendar access
            await checkCalendarAccess(response.access_token)
        } catch (err) {
            setError('Failed to get user info')
            console.error('Error getting user info:', err)
        }
    }, [])

    const checkSignInStatus = useCallback(async () => {
        // For now, we'll assume user is not signed in
        // In a real app, you'd check for stored tokens
        setIsSignedIn(false)
        setUser(null)
    }, [])

    const signIn = async () => {
        try {
            setIsLoading(true)
            setError(null)

            if (tokenClient) {
                tokenClient.requestAccessToken()
            } else {
                setError('Google client not initialized')
            }
        } catch (err) {
            setError('Failed to sign in')
            console.error('Error signing in:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const signOut = async () => {
        try {
            setIsLoading(true)

            // Revoke the token
            if (window.google) {
                const token = localStorage.getItem('google_access_token')
                if (token) {
                    await window.google.accounts.oauth2.revoke(token)
                    localStorage.removeItem('google_access_token')
                }
            }

            setIsSignedIn(false)
            setUser(null)
            setCalendarConnected(false)
            setCalendarEvents([])
        } catch (err) {
            setError('Failed to sign out')
            console.error('Error signing out:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const checkCalendarAccess = async (accessToken: string) => {
        try {
            // Store the token for later use
            localStorage.setItem('google_access_token', accessToken)

            // Test calendar access
            const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })

            if (response.ok) {
                setCalendarConnected(true)
                await loadCalendarEvents(accessToken)
            } else {
                setCalendarConnected(false)
                console.error('Calendar not accessible:', response.statusText)
            }
        } catch (err) {
            setCalendarConnected(false)
            console.error('Calendar not accessible:', err)
        }
    }

    const loadCalendarEvents = async (accessToken: string) => {
        try {
            const now = new Date()
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
                `timeMin=${now.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&` +
                `singleEvents=true&orderBy=startTime`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            )

            if (response.ok) {
                const data = await response.json()
                setCalendarEvents(data.items || [])
            }
        } catch (err) {
            console.error('Error loading calendar events:', err)
        }
    }

    if (!GOOGLE_CONFIG.clientId) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <p className="text-yellow-800">
                        Google OAuth not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.
                    </p>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <p className="text-red-800">{error}</p>
                </div>
                <button
                    onClick={() => setError(null)}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                    Dismiss
                </button>
            </div>
        )
    }

    if (!isSignedIn) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Connect Your Google Calendar
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Sign in with Google to sync your assignments with your calendar
                    </p>
                    <button
                        onClick={signIn}
                        disabled={isLoading}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* User Info */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <img
                        src={user?.picture}
                        alt={user?.name}
                        className="w-10 h-10 rounded-full"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={signOut}
                    className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                </button>
            </div>

            {/* Calendar Status */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <span className="font-medium text-gray-900">Google Calendar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        {calendarConnected ? (
                            <>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-green-600">Connected</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm text-yellow-600">Not Connected</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Calendar Events */}
            {calendarConnected && calendarEvents.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Upcoming Events (Next 7 Days)</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {calendarEvents.slice(0, 5).map((event) => (
                            <div key={event.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {event.summary}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {event.start.dateTime
                                            ? new Date(event.start.dateTime).toLocaleDateString()
                                            : event.start.date
                                        }
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {calendarEvents.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            +{calendarEvents.length - 5} more events
                        </p>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            const token = localStorage.getItem('google_access_token')
                            if (token) loadCalendarEvents(token)
                        }}
                        className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Refresh Events
                    </button>
                    <button
                        onClick={() => window.open('https://calendar.google.com', '_blank')}
                        className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Open Calendar
                    </button>
                </div>
            </div>
        </div>
    )
}
