const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  // Health check
  health: () => fetch(`${API_BASE_URL}/health`),
  
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
    return fetch(`${API_BASE_URL}/files?${params.toString()}`)
  },
  
  getFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/files/${fileId}`),
  
  deleteFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/files/${fileId}`, {
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
    fetch(`${API_BASE_URL}/users/${userId}`),
  
  getUserByGoogleId: (googleId: string) => 
    fetch(`${API_BASE_URL}/users/google/${googleId}`),
  
  // Summaries - Read Only (for frontend display)
  getSummary: (summaryId: number) => 
    fetch(`${API_BASE_URL}/summaries/${summaryId}`),
  
  getSummaryByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/summaries/file/${fileId}?t=${Date.now()}`),
  
  // Assignments - Read Only (for frontend display)
  getAssignments: (fileId?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${API_BASE_URL}/assignments?${params.toString()}`)
  },
  
  getAssignment: (assignmentId: number) => 
    fetch(`${API_BASE_URL}/assignments/${assignmentId}`),
  
  getAssignmentsByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/assignments/file/${fileId}?t=${Date.now()}`),
  
  // Exams - Read Only (for frontend display)
  getExams: (fileId?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${API_BASE_URL}/exams?${params.toString()}`)
  },
  
  getExam: (examId: number) => 
    fetch(`${API_BASE_URL}/exams/${examId}`),
  
  getExamsByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/exams/file/${fileId}?t=${Date.now()}`),
  
  getSyllabusData: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/parse/${fileId}/all?t=${Date.now()}`),
  
  getLectures: (fileId?: number, day?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    if (day !== undefined) params.append('day', day.toString())
    params.append('t', Date.now().toString()) // Cache busting
    
    return fetch(`${API_BASE_URL}/lectures?${params.toString()}`)
  },
  
  getLecture: (lectureId: number) => 
    fetch(`${API_BASE_URL}/lectures/${lectureId}`),
  
  getLecturesByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/lectures/file/${fileId}?t=${Date.now()}`),
  
  // Users - Essential operations for frontend
  createUser: (userData: { google_id: string; email: string; name: string }) =>
    fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  updateUser: (userId: number, userData: { name?: string; email?: string }) =>
    fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  // Processing endpoints
  parseSyllabus: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/parse/${fileId}`, {
      method: 'POST'
    }),
  
  getParsingStatus: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/parse/${fileId}/status`),
  
  cancelParsing: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/parse/${fileId}/cancel`, {
      method: 'POST'
    }),
  
  getFileSummary: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/summary/${fileId}`),
  
  getExamDates: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/exams/${fileId}`),
  
  getAssignmentDates: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/assignments/${fileId}`),
  
  getLectureSchedule: (fileId: number) => 
    fetch(`${API_BASE_URL}/processing/lectures/${fileId}`),
}

export default api
