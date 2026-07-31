import { useState } from 'react'
import { X } from 'lucide-react'
import StarRating from './StarRating'

const EMPTY_FORM = {
  title: '',
  type: 'book',
  rating: 0,
  review: '',
  completedDate: '',
  coverUrl: '',
}

function EntryModal({ mode, entry, onClose, onSubmit }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(
    isEdit
      ? {
          rating: entry.rating,
          review: entry.review,
          coverUrl: entry.coverUrl,
        }
      : EMPTY_FORM,
  )

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isEdit) {
      onSubmit({ ...entry, ...form, rating: Number(form.rating) })
    } else {
      onSubmit({
        ...form,
        rating: Number(form.rating),
        status: '완료',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '기록 수정' : '새 기록 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label="닫기"
          >
            <X size={20} />
          </button>
        </div>

        {isEdit && (
          <p className="mb-4 text-sm text-gray-500">
            {entry.title} · {entry.completedDate}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={handleChange('title')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  유형
                </label>
                <select
                  value={form.type}
                  onChange={handleChange('type')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="book">책</option>
                  <option value="movie">영화</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  완료일
                </label>
                <input
                  type="date"
                  required
                  value={form.completedDate}
                  onChange={handleChange('completedDate')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">평점</label>
            <StarRating
              rating={Number(form.rating)}
              onChange={(value) => setForm((prev) => ({ ...prev, rating: value }))}
              size={22}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              한줄평
            </label>
            <input
              type="text"
              value={form.review}
              onChange={handleChange('review')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              커버이미지 URL
            </label>
            <input
              type="text"
              value={form.coverUrl}
              onChange={handleChange('coverUrl')}
              placeholder="https://..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EntryModal
