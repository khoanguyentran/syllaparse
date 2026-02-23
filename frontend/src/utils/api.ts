const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  // Files - Upload via Next.js API route (which uploads to GCS and calls Python backend)
  uploadFile: (file: File, googleId: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('googleId', googleId)
    
    return fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
  },
  
  getFiles: (userId?: number, googleId?: string) => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId.toString())
    if (googleId) params.append('google_id', googleId)
    return fetch(`${publicApiUrl}/files?${params.toString()}`)
  },
  
  getFile: (fileId: string) => 
    fetch(`${publicApiUrl}/files/${fileId}`),
  
  deleteFile: (fileId: string) => 
    fetch(`${publicApiUrl}/files/${fileId}`, {
      method: 'DELETE'
    }),
  
  // Authentication
  googleLogin: (userInfo: { id: string; email: string; name: string; picture?: string }) =>
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ googleUser: userInfo })
    }),
  
  getUserByGoogleId: (googleId: string) => 
    fetch(`${publicApiUrl}/users/google/${googleId}`),
  
  // Summaries - Read Only (for frontend display)
  getSummaryByFile: (fileId: string) => 
    fetch(`${publicApiUrl}/summaries/file/${fileId}?t=${Date.now()}`),
  
  // Assignments - Read Only (for frontend display)
  getAssignmentsByFile: (fileId: string) => 
    fetch(`${publicApiUrl}/assignments/file/${fileId}?t=${Date.now()}`),
  
  // Exams - Read Only (for frontend display)
  getExamsByFile: (fileId: string) => 
    fetch(`${publicApiUrl}/exams/file/${fileId}?t=${Date.now()}`),
  
  getLecturesByFile: (fileId: string) => 
    fetch(`${publicApiUrl}/lectures/file/${fileId}?t=${Date.now()}`),
  
  // Processing endpoints
  getParsingStatus: (fileId: string) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}/status`),
  
  cancelParsing: (fileId: string) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}/cancel`, {
      method: 'POST'
    }),
  
  getGradingBreakdown: (fileId: string) => 
    fetch(`${publicApiUrl}/processing/grading/${fileId}`),
  
  // Google Calendar endpoints
  storeGoogleToken: (accessToken: string) =>
    fetch(`${publicApiUrl}/auth/google/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ access_token: accessToken })
    }),
  
  googleLogout: () =>
    fetch(`${publicApiUrl}/auth/google/logout`, {
      method: 'POST',
      credentials: 'include'
    }),
  
  checkCalendarAccess: () =>
    fetch(`${publicApiUrl}/auth/google/calendar/check`, {
      credentials: 'include'
    }),
  
  createCalendarEvent: (eventData: {
    summary: string
    description?: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    location?: string
    reminders?: any
  }) =>
    fetch(`${publicApiUrl}/auth/google/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(eventData)
    }),
}

export default api
