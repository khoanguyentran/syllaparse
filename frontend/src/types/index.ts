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

export interface SyllabusFile {
  file_id: number
  filename: string
  upload_date: string
  filepath: string
  user_id: number
}

export interface Lecture {
  id: number
  file_id: number
  day: number // 0 = monday, 1 = tuesday, etc.
  start_time: string
  end_time: string
  start_date: string
  end_date: string
  location: string | null
  created_at: string
}

export interface AssignmentExam {
  id: number
  file_id: number
  parsed_date: string
  confidence: number | null
  type: 'assignment' | 'exam'
  description: string
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  summary: string
  description: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: string
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
