export interface SyllabusFile {
  file_id: string  // UUID as string
  filename: string
  upload_date: string
  filepath: string
  user_id: number
}

export interface Assignment {
  id: number
  file_id?: string  // UUID as string
  date: string         // YYYY-MM-DD format
  time_due: string | null  // HH:MM format, optional
  confidence: number | null
  description: string
  created_at?: string
  updated_at?: string
}

export interface Exam {
  id: number
  file_id?: string  // UUID as string
  date: string         // YYYY-MM-DD format
  time_due: string | null  // HH:MM format, optional
  confidence: number | null
  description: string
  created_at?: string
  updated_at?: string
}

export interface Lecture {
  id: number
  file_id: string  // UUID as string
  day: number // 0 = monday, 1 = tuesday, etc.
  start_time: string
  end_time: string
  start_date: string
  end_date: string
  location: string | null
  type?: 'lecture' | 'lab' | 'discussion' // Type of session
  created_at: string
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
