import { BookOpen } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-500">
        <BookOpen className="w-6 h-6" />
        <span>독서/영화 기록 트래커</span>
      </div>
    </div>
  )
}

export default App
