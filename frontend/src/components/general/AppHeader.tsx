import { Calendar, BookOpen } from 'lucide-react'
import { format } from 'date-fns'
import GoogleSignIn from './GoogleSignIn'

interface AppHeaderProps {
  onGoogleIdChange: (googleId: string | null) => void
}

export default function AppHeader({ onGoogleIdChange }: AppHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Syllaparse</h1>
              <p className="text-sm text-gray-600">Extract assignments and exams with dates</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Calendar className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600 whitespace-nowrap">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
            <GoogleSignIn onGoogleIdChange={onGoogleIdChange} />
          </div>
        </div>
      </div>
    </header>
  )
}
