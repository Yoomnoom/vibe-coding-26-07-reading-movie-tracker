import { useMemo, useRef, useState } from 'react'
import { initialEntries } from './data/mockEntries'
import Toolbar from './components/Toolbar'
import EntryCard from './components/EntryCard'
import EntryModal from './components/EntryModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import UndoToast from './components/UndoToast'

const UNDO_DURATION = 5000

function App() {
  const [entries, setEntries] = useState(initialEntries)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('date')
  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [pendingUndo, setPendingUndo] = useState(null) // { entry, index }
  const undoTimerRef = useRef(null)

  const visibleEntries = useMemo(() => {
    const filtered =
      filter === 'all' ? entries : entries.filter((e) => e.type === filter)

    return [...filtered].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating
      return b.completedDate.localeCompare(a.completedDate)
    })
  }, [entries, filter, sort])

  const handleCreate = (formData) => {
    const newEntry = {
      ...formData,
      id: `entry-${Date.now()}`,
    }
    setEntries((prev) => [newEntry, ...prev])
    setModalMode(null)
  }

  const handleUpdate = (updatedEntry) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)),
    )
    setModalMode(null)
    setEditingEntry(null)
  }

  const handleConfirmDelete = () => {
    const index = entries.findIndex((e) => e.id === deletingEntry.id)
    setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id))

    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingUndo({ entry: deletingEntry, index })
    undoTimerRef.current = setTimeout(() => setPendingUndo(null), UNDO_DURATION)

    setDeletingEntry(null)
  }

  const handleUndo = () => {
    if (!pendingUndo) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setEntries((prev) => {
      const next = [...prev]
      next.splice(pendingUndo.index, 0, pendingUndo.entry)
      return next
    })
    setPendingUndo(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          독서/영화 기록 트래커
        </h1>

        <Toolbar
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          onAddClick={() => setModalMode('create')}
        />

        {visibleEntries.length === 0 ? (
          <p className="text-center text-gray-400 py-20">기록이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onClick={(e) => {
                  setEditingEntry(e)
                  setModalMode('edit')
                }}
                onDelete={setDeletingEntry}
              />
            ))}
          </div>
        )}
      </div>

      {modalMode === 'create' && (
        <EntryModal
          mode="create"
          onClose={() => setModalMode(null)}
          onSubmit={handleCreate}
        />
      )}

      {modalMode === 'edit' && editingEntry && (
        <EntryModal
          mode="edit"
          entry={editingEntry}
          onClose={() => {
            setModalMode(null)
            setEditingEntry(null)
          }}
          onSubmit={handleUpdate}
        />
      )}

      {deletingEntry && (
        <ConfirmDeleteModal
          entry={deletingEntry}
          onCancel={() => setDeletingEntry(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {pendingUndo && (
        <UndoToast
          message={`'${pendingUndo.entry.title}' 항목을 삭제했습니다.`}
          onUndo={handleUndo}
        />
      )}
    </div>
  )
}

export default App
