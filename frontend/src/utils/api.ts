const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  // Health check
  health: () => fetch(`${publicApiUrl}/health`),
  
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
  
  getFile: (fileId: number) => 
    fetch(`${publicApiUrl}/files/${fileId}`),
  
  deleteFile: (fileId: number) => 
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
  
  getUser: (userId: number) => 
    fetch(`${publicApiUrl}/users/${userId}`),
  
  getUserByGoogleId: (googleId: string) => 
    fetch(`${publicApiUrl}/users/google/${googleId}`),
  
  // Summaries - Read Only (for frontend display)
  getSummary: (summaryId: number) => 
    fetch(`${publicApiUrl}/summaries/${summaryId}`),
  
  getSummaryByFile: (fileId: number) => 
    fetch(`${publicApiUrl}/summaries/file/${fileId}?t=${Date.now()}`),
  
  // Assignments - Read Only (for frontend display)
  getAssignments: (fileId?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${publicApiUrl}/assignments?${params.toString()}`)
  },
  
  getAssignment: (assignmentId: number) => 
    fetch(`${publicApiUrl}/assignments/${assignmentId}`),
  
  getAssignmentsByFile: (fileId: number) => 
    fetch(`${publicApiUrl}/assignments/file/${fileId}?t=${Date.now()}`),
  
  // Exams - Read Only (for frontend display)
  getExams: (fileId?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${publicApiUrl}/exams?${params.toString()}`)
  },
  
  getExam: (examId: number) => 
    fetch(`${publicApiUrl}/exams/${examId}`),
  
  getExamsByFile: (fileId: number) => 
    fetch(`${publicApiUrl}/exams/file/${fileId}?t=${Date.now()}`),
  
  getSyllabusData: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}/all?t=${Date.now()}`),
  
  getLectures: (fileId?: number, day?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    if (day !== undefined) params.append('day', day.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${publicApiUrl}/lectures?${params.toString()}`)
  },
  
  getLecture: (lectureId: number) => 
    fetch(`${publicApiUrl}/lectures/${lectureId}`),
  
  getLecturesByFile: (fileId: number) => 
    fetch(`${publicApiUrl}/lectures/file/${fileId}?t=${Date.now()}`),
  
  // Users - Essential operations for frontend
  createUser: (userData: { google_id: string; email: string; name: string }) =>
    fetch(`${publicApiUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  updateUser: (userId: number, userData: { name?: string; email?: string }) =>
    fetch(`${publicApiUrl}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  // Processing endpoints
  parseSyllabus: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}`, {
      method: 'POST'
    }),
  
  getParsingStatus: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}/status`),
  
  cancelParsing: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/parse/${fileId}/cancel`, {
      method: 'POST'
    }),
  
  getFileSummary: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/summary/${fileId}`),
  
  getExamDates: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/exams/${fileId}`),
  
  getAssignmentDates: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/assignments/${fileId}`),
  
  getLectureSchedule: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/lectures/${fileId}`),
  
  getGradingBreakdown: (fileId: number) => 
    fetch(`${publicApiUrl}/processing/grading/${fileId}`),
}

export default api
