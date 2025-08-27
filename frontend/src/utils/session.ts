export interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
}

export interface StoredSession {
  user: GoogleUser
  googleId: string
  timestamp: number
}

const SESSION_KEY = 'syllaparse_google_session'
const SESSION_EXPIRY_HOURS = 24 // Sessions expire after 24 hours

// Check if session is expired
export const isSessionExpired = (timestamp: number): boolean => {
  const now = Date.now()
  const expiryTime = timestamp + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000)
  return now > expiryTime
}

// Save session to localStorage
export const saveSession = (userData: GoogleUser, id: string): void => {
  const session: StoredSession = {
    user: userData,
    googleId: id,
    timestamp: Date.now()
  }
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (err) {
    console.warn('Failed to save session to localStorage:', err)
  }
}

// Load session from localStorage
export const loadSession = (): StoredSession | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null
    
    const session: StoredSession = JSON.parse(stored)
    
    // Check if session is expired
    if (isSessionExpired(session.timestamp)) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    
    return session
  } catch (err) {
    console.warn('Failed to load session from localStorage:', err)
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

// Clear session from localStorage
export const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch (err) {
    console.warn('Failed to clear session from localStorage:', err)
  }
}

// Check if user is currently authenticated
export const isAuthenticated = (): boolean => {
  const session = loadSession()
  return session !== null
}

// Get current user from session
export const getCurrentUser = (): GoogleUser | null => {
  const session = loadSession()
  return session?.user || null
}

// Get current Google ID from session
export const getCurrentGoogleId = (): string | null => {
  const session = loadSession()
  return session?.googleId || null
}
