'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import Image from 'next/image'
import { FcGoogle } from 'react-icons/fc'
import { api } from '@/utils/api'
import { saveSession, loadSession, clearSession, GoogleUser } from '@/utils/session'

interface GoogleSignInProps {
  onGoogleIdChange: (googleId: string | null) => void
}

export default function GoogleSignIn({ onGoogleIdChange }: GoogleSignInProps) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [googleId, setGoogleId] = useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [useProxy, setUseProxy] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Silently restore session on component mount
  useEffect(() => {
    const restoreSession = async () => {
      const session = loadSession()
      
      if (session) {
        console.log('Silently restoring session for user:', session.user.name)
        
        // Set the user state immediately without showing loading
        setUser(session.user)
        setGoogleId(session.googleId)
        setIsSignedIn(true)
        
        // Notify parent component
        onGoogleIdChange(session.googleId)
        
        // Validate session with backend in the background (silently)
        try {
          const authResponse = await api.googleLogin(session.user)
          if (!authResponse.ok) {
            console.warn('Session validation failed, clearing session')
            clearSession()
            setUser(null)
            setGoogleId(null)
            setIsSignedIn(false)
            onGoogleIdChange(null)
          }
        } catch (err) {
          console.warn('Session validation error, clearing session:', err)
          clearSession()
          setUser(null)
          setGoogleId(null)
          setIsSignedIn(false)
          onGoogleIdChange(null)
        }
      }
      
      // Mark as initialized (this happens regardless of session state)
      setIsInitialized(true)
    }

    restoreSession()
  }, [onGoogleIdChange])

  const handleTokenResponse = useCallback(async (response: any) => {
    try {
      // Store the access token for calendar operations
      localStorage.setItem('google_access_token', response.access_token)
      
      // Get user info from Google
      const userInfo = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`
      )

      if (!userInfo.ok) {
        throw new Error('Failed to get user info from Google')
      }

      const userData = await userInfo.json()
      
      const googleUser: GoogleUser = {
        id: userData.sub, 
        name: userData.name,
        email: userData.email,
        picture: userData.picture,
      }
      

      // Validate required fields
      if (!googleUser.id || !googleUser.name || !googleUser.email) {
        console.error('Missing required user data:', {
          id: googleUser.id,
          name: googleUser.name,
          email: googleUser.email
        })
        throw new Error('Incomplete user data from Google')
      }

      setUser(googleUser)
      setGoogleId(googleUser.id)
      setIsSignedIn(true)
      setError(null)
      
      // Save session to localStorage
      saveSession(googleUser, googleUser.id)
      
      // Notify parent component of Google ID change
      onGoogleIdChange(googleUser.id)

      // Call Next.js API route for authentication
      try {
        const authResponse = await api.googleLogin(googleUser)

        if (authResponse.ok) {
          // User authenticated successfully
        } else {
          const errorData = await authResponse.json()
          setError('Failed to authenticate with backend')
        }
      } catch (authErr) {
        setError('Failed to authenticate with backend')
      }

      // Check calendar access
      await checkCalendarAccess(response.access_token)
    } catch (error) {
      console.error('Error in token response:', error)
      setError('Failed to get user information')
    }
  }, [onGoogleIdChange])

  const login = useGoogleLogin({
    onSuccess: handleTokenResponse,
    onError: () => setError('Login Failed'),
    scope: 'openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
  })

  const checkCalendarAccess = async (accessToken: string) => {
    try {
      const calendarResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (calendarResponse.ok) {
        // Calendar access granted
      } else {
        // Calendar access denied or not requested
      }
    } catch (error) {
      console.error('Error checking calendar access:', error)
    }
  }

  const signOut = () => {
    setUser(null)
    setGoogleId(null)
    setIsSignedIn(false)
    setError(null)
    setImageError(false)
    setUseProxy(false)
    setImageLoading(false)
    
    // Clear session from localStorage
    clearSession()
    
    // Clear access token
    localStorage.removeItem('google_access_token')
    
    // Notify parent component that Google ID is cleared
    onGoogleIdChange(null)
  }

  const handleImageError = () => {
    if (!useProxy) {
      setUseProxy(true)
      setImageLoading(true)
    } else {
      setImageError(true)
      setImageLoading(false)
    }
  }

  const handleImageLoad = () => {
    setImageError(false)
    setUseProxy(false)
    setImageLoading(false)
  }

  const handleImageStartLoad = () => {
    setImageLoading(true)
  }

  const retryImageLoad = () => {
    setImageError(false)
    setUseProxy(false)
    setImageLoading(false)
  }

  const refreshProfilePicture = async () => {
    if (!user?.id) return
    
    setImageLoading(true)
    
    try {
      setImageLoading(false)
      alert('To get a fresh profile picture, please sign out and sign in again. Google profile picture URLs expire for security reasons.')
    } catch (error) {
      setImageLoading(false)
    }
  }

  const getImageSrc = () => {
    if (!user?.picture) return null
    
    if (useProxy) {
      const proxyUrl = `/api/profile-picture/?url=${encodeURIComponent(user.picture)}`
      return proxyUrl
    }
    
    return user.picture
  }

  // Don't render anything until we've checked for existing sessions
  if (!isInitialized) {
    return null // This prevents any flash of content
  }

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      {!isSignedIn ? (
        <div className="text-center">
          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center px-6 py-3 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center space-x-3">
              <FcGoogle className="w-6 h-6" />
              <span className="text-lg font-medium text-gray-700">Sign in with Google</span>
            </div>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {user?.picture && !imageError ? (
                <div className="w-10 h-10 rounded-full ring-2 ring-blue-50 shadow-sm overflow-hidden relative">
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <Image
                    src={getImageSrc() || ''}
                    alt={`${user.name}'s profile`}
                    width={40}
                    height={40}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    onLoadStart={handleImageStartLoad}
                    unoptimized={true}
                    priority={true}
                  />
                </div>
              ) : (
                <div 
                  className="w-10 h-10 rounded-full ring-2 ring-blue-50 shadow-sm bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-bold relative cursor-pointer" 
                  onClick={retryImageLoad}
                  title="Click to retry loading profile picture"
                >
                  {user?.name?.charAt(0) || 'U'}
                  {/* Small indicator that this is a fallback */}
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white flex items-center justify-center">
                    <svg className="w-1 h-1 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {user?.name}
              </h3>
              <p className="text-xs text-gray-600 line-clamp-1">
                {user?.email}
              </p>
            </div>
            <button
              onClick={signOut}
              className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-md transition-all focus-ring focus:outline-none shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700 font-medium">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Helpful message when profile picture fails to load */}
      {imageError && user?.picture && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-xs text-blue-700 font-medium">
                Profile picture not loading?
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Try signing out and back in for a fresh URL.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
