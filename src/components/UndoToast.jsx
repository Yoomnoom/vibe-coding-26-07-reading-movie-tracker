function UndoToast({ message, onUndo }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-gray-900 text-white px-4 py-2.5 shadow-lg text-sm">
      <span>{message}</span>
      <button
        type="button"
        onClick={onUndo}
        className="font-medium text-blue-300 hover:text-blue-200 cursor-pointer"
      >
        되돌리기
      </button>
    </div>
  )
}

export default UndoToast
