export interface SyllabusFile {
  file_id: number
  filename: string
  upload_date: string
  filepath: string
  user_id: number
}

export interface Assignment {
  id: string
  title: string
  dueDate: string
  description?: string
  course?: string
  location?: string
}

export interface Exam {
  id: string
  title: string
  examDate: string
  description?: string
  course?: string
  location?: string
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
  type?: 'lecture' | 'lab' | 'discussion' // Type of session
  created_at: string
}


export interface BackendAssignment {
  id: number
  file_id: number
  due_date: string
  confidence: number | null
  description: string
  created_at: string
  updated_at: string
}

export interface BackendExam {
  id: number
  file_id: number
  exam_date: string
  confidence: number | null
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
