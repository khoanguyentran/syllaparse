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
    fetch(`${API_BASE_URL}/summaries/file/${fileId}`),
  
  // Assignments/Exams - Read Only (for frontend display)
  getAssignmentsExams: (fileId?: number, type?: string) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    if (type) params.append('type', type)
    
    return fetch(`${API_BASE_URL}/assignments-exams?${params.toString()}`)
  },
  
  getAssignmentExam: (assignmentId: number) => 
    fetch(`${API_BASE_URL}/assignments-exams/${assignmentId}`),
  
  getAssignmentsExamsByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/assignments-exams/file/${fileId}`),
  
  getLectures: (fileId?: number, day?: number) => {
    const params = new URLSearchParams()
    if (fileId) params.append('file_id', fileId.toString())
    if (day !== undefined) params.append('day', day.toString())
    
    return fetch(`${API_BASE_URL}/lectures?${params.toString()}`)
  },
  
  getLecture: (lectureId: number) => 
    fetch(`${API_BASE_URL}/lectures/${lectureId}`),
  
  getLecturesByFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/lectures/file/${fileId}`),
  
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
    })
}

export default api
