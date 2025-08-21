const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  // Health check
  health: () => fetch(`${API_BASE_URL}/health`),
  
  // Files
  uploadFile: (file: File, userId: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId.toString())
    
    return fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData
    })
  },
  
  getFiles: (userId: number) => 
    fetch(`${API_BASE_URL}/api/files?user_id=${userId}`),
  
  getFile: (fileId: number) => 
    fetch(`${API_BASE_URL}/api/files/${fileId}`),
  
  // Summaries
  getSummary: (fileId: number) => 
    fetch(`${API_BASE_URL}/api/summaries/${fileId}`),
  
  // Assignments/Exams
  getAssignmentsExams: (fileId: number) => 
    fetch(`${API_BASE_URL}/api/assignments-exams?file_id=${fileId}`),
  
  // Users
  createUser: (userData: { email: string; name: string; password: string }) =>
    fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }),
  
  login: (credentials: { email: string; password: string }) =>
    fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
}

export default api
