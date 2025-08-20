export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Syllaparse
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A simple, modern fullstack application
        </p>
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Tech Stack</h2>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Next.js
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                React
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                FastAPI
              </span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                TypeScript
              </span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
            <p className="text-gray-600">
              Check the README for setup instructions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
