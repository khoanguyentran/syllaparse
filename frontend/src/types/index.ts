export interface Assignment {
  id: string
  title: string
  type: 'exam' | 'homework' | 'quiz' | 'project' | 'presentation' | 'lab'
  dueDate: string
  description?: string
  course?: string
  priority: 'high' | 'medium' | 'low'
  weight?: number // percentage of final grade
  location?: string // room number, online, etc.
  materials?: string[] // required materials
  completed?: boolean // whether the assignment is completed
}

export interface Course {
  id: string
  name: string
  code: string
  instructor: string
  semester: string
  year: string
  assignments: Assignment[]
}

export interface SyllabusData {
  courses: Course[]
  totalAssignments: number
  semester: string
  academicYear: string
}

export interface UploadProgress {
  percentage: number
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error'
  message?: string
}

export interface FilterOptions {
  course?: string
  type?: Assignment['type']
  priority?: Assignment['priority']
  dueDateRange?: {
    start: Date
    end: Date
  }
  searchQuery?: string
}
