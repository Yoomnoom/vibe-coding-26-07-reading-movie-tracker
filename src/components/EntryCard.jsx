import { Trash2 } from 'lucide-react'
import TypeBadge from './TypeBadge'
import StarRating from './StarRating'
import CoverImage from './CoverImage'

function EntryCard({ entry, onClick, onDelete }) {
  return (
    <div className="group relative flex h-full flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onClick(entry)}
        className="flex flex-1 flex-col text-left cursor-pointer"
      >
        <div className="shrink-0">
          <CoverImage coverUrl={entry.coverUrl} type={entry.type} title={entry.title} />
        </div>
        <div className="flex flex-1 flex-col justify-between gap-1.5 p-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-gray-900 truncate">{entry.title}</h3>
              <TypeBadge type={entry.type} />
            </div>
            <StarRating rating={entry.rating} size={14} />
            <p className="text-sm text-gray-500 line-clamp-2">{entry.review}</p>
          </div>
          <p className="text-xs text-gray-400">{entry.completedDate}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={() => onDelete(entry)}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-white transition-opacity cursor-pointer"
        aria-label="삭제"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

export default EntryCard
