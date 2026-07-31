import { TYPE_LABELS } from '../data/mockEntries'

const STYLES = {
  book: 'bg-blue-100 text-blue-700',
  movie: 'bg-rose-100 text-rose-700',
}

function TypeBadge({ type }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[type]}`}
    >
      {TYPE_LABELS[type]}
    </span>
  )
}

export default TypeBadge
