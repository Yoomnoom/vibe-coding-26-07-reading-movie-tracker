import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Plus } from 'lucide-react'
import Toolbar from './components/Toolbar'
import EntryCard from './components/EntryCard'
import EntryCardSkeleton from './components/EntryCardSkeleton'
import EntryModal from './components/EntryModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import UndoToast from './components/UndoToast'
import ErrorToast from './components/ErrorToast'

const UNDO_DURATION = 5000
const NOTIFICATION_DURATION = 4000
const SKELETON_COUNT = 8

function App() {
  const [dataSource, setDataSource] = useState('notion') // 'notion' | 'sheets'
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')
  const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
  const [editingEntry, setEditingEntry] = useState(null)
  const [deletingEntry, setDeletingEntry] = useState(null)
  const [pendingUndo, setPendingUndo] = useState(null) // { entry, index }
  const [notification, setNotification] = useState(null)
  const undoTimerRef = useRef(null)
  const notificationTimerRef = useRef(null)

  const notifyError = useCallback((message) => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current)
    setNotification(message)
    notificationTimerRef.current = setTimeout(
      () => setNotification(null),
      NOTIFICATION_DURATION,
    )
  }, [])

  const loadEntries = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(false)

    fetch(`/api/entries?source=${dataSource}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setEntries(data.entries ?? [])
      })
      .catch((err) => {
        console.error(`Failed to load entries from ${dataSource}`, err)
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [dataSource])

  useEffect(() => loadEntries(), [loadEntries])

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = entries
      .filter((e) => filter === 'all' || e.type === filter)
      .filter((e) => !query || e.title.toLowerCase().includes(query))

    return [...filtered].sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating
      return b.completedDate.localeCompare(a.completedDate)
    })
  }, [entries, filter, search, sort])

  const handleCreate = async (formData) => {
    try {
      const res = await fetch(`/api/entries?source=${dataSource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error(await res.text())
      const { entry } = await res.json()
      setEntries((prev) => [entry, ...prev])
      setModalMode(null)
    } catch (err) {
      console.error(`Failed to create entry in ${dataSource}`, err)
      notifyError('등록에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleUpdate = async (updatedEntry) => {
    try {
      const res = await fetch(`/api/entries/${updatedEntry.id}?source=${dataSource}`, {
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
      console.error(`Failed to update entry in ${dataSource}`, err)
      notifyError('수정에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleConfirmDelete = async () => {
    const target = deletingEntry
    const index = entries.findIndex((e) => e.id === target.id)
    setDeletingEntry(null)

    try {
      const res = await fetch(`/api/entries/${target.id}?source=${dataSource}`, {
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
      console.error(`Failed to archive entry in ${dataSource}`, err)
      notifyError('삭제에 실패했습니다. 다시 시도해주세요.')
    }
  }

  const handleUndo = async () => {
    if (!pendingUndo) return
    const { entry, index } = pendingUndo
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingUndo(null)

    try {
      const res = await fetch(`/api/entries/${entry.id}?source=${dataSource}`, {
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
      console.error(`Failed to restore entry in ${dataSource}`, err)
      notifyError('되돌리기에 실패했습니다. 항목은 삭제된 상태로 남아 있습니다.')
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
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          onAddClick={() => setModalMode('create')}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <EntryCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="text-red-400" size={40} />
            <p className="text-gray-500">데이터를 불러올 수 없습니다.</p>
            <button
              type="button"
              onClick={loadEntries}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-gray-500">아직 등록된 기록이 없습니다.</p>
            <button
              type="button"
              onClick={() => setModalMode('create')}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 cursor-pointer"
            >
              <Plus size={20} />새 기록 추가
            </button>
          </div>
        ) : visibleEntries.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            조건에 맞는 기록이 없습니다.
          </p>
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

      {notification && <ErrorToast message={notification} />}
    </div>
  )
}

export default App
