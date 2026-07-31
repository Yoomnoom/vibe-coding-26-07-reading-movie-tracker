import { useEffect, useMemo, useRef, useState } from 'react'
import Toolbar from './components/Toolbar'
import EntryCard from './components/EntryCard'
import EntryCardSkeleton from './components/EntryCardSkeleton'
import EntryModal from './components/EntryModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import UndoToast from './components/UndoToast'

const UNDO_DURATION = 5000
const SKELETON_COUNT = 8

function App() {
  const [dataSource, setDataSource] = useState('notion') // 'notion' | 'sheets'
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('date')
  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [pendingUndo, setPendingUndo] = useState(null) // { entry, index }
  const undoTimerRef = useRef(null)

  useEffect(() => {
    if (dataSource === 'sheets') {
      setEntries([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    fetch('/api/entries')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        setEntries(data.entries ?? [])
      })
      .catch((err) => {
        console.error('Failed to load entries from Notion', err)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dataSource])

  const visibleEntries = useMemo(() => {
    const filtered =
      filter === 'all' ? entries : entries.filter((e) => e.type === filter)

    return [...filtered].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating
      return b.completedDate.localeCompare(a.completedDate)
    })
  }, [entries, filter, sort])

  const handleCreate = async (formData) => {
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      const { entry } = await res.json()
      setEntries((prev) => [entry, ...prev])
      setModalMode(null)
    } catch (err) {
      console.error('Failed to create entry in Notion', err)
    }
  }

  const handleUpdate = async (updatedEntry) => {
    try {
      const res = await fetch(`/api/entries/${updatedEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: updatedEntry.rating,
          review: updatedEntry.review,
          coverUrl: updatedEntry.coverUrl,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { entry } = await res.json()
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)))
      setModalMode(null)
      setEditingEntry(null)
    } catch (err) {
      console.error('Failed to update entry in Notion', err)
    }
  }

  const handleConfirmDelete = async () => {
    const target = deletingEntry
    const index = entries.findIndex((e) => e.id === target.id)
    setDeletingEntry(null)

    try {
      const res = await fetch(`/api/entries/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })
      if (!res.ok) throw new Error(await res.text())

      setEntries((prev) => prev.filter((e) => e.id !== target.id))

      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      setPendingUndo({ entry: target, index })
      undoTimerRef.current = setTimeout(() => setPendingUndo(null), UNDO_DURATION)
    } catch (err) {
      console.error('Failed to archive entry in Notion', err)
    }
  }

  const handleUndo = async () => {
    if (!pendingUndo) return
    const { entry, index } = pendingUndo
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingUndo(null)

    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: false }),
      })
      if (!res.ok) throw new Error(await res.text())

      setEntries((prev) => {
        const next = [...prev]
        next.splice(index, 0, entry)
        return next
      })
    } catch (err) {
      console.error('Failed to restore entry in Notion', err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          독서/영화 기록 트래커
        </h1>

        <Toolbar
          dataSource={dataSource}
          onDataSourceChange={setDataSource}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          onAddClick={() => setModalMode('create')}
          addDisabled={dataSource === 'sheets'}
        />

        {dataSource === 'sheets' ? (
          <p className="text-center text-gray-400 py-20">
            Google Sheets 연동은 준비 중입니다.
          </p>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <EntryCardSkeleton key={i} />
            ))}
          </div>
        ) : visibleEntries.length === 0 ? (
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
