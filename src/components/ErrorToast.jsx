import { AlertCircle } from 'lucide-react'

function ErrorToast({ message }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2.5 shadow-lg text-sm">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  )
}

export default ErrorToast
