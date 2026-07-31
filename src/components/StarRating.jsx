import { Star } from 'lucide-react'

function StarRating({ rating, onChange, size = 18 }) {
  const stars = [1, 2, 3, 4, 5]
  const editable = typeof onChange === 'function'
  const Tag = editable ? 'button' : 'span'

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((value) => {
        const filled = value <= rating
        return (
          <Tag
            key={value}
            type={editable ? 'button' : undefined}
            onClick={editable ? () => onChange(value) : undefined}
            className={editable ? 'cursor-pointer' : 'cursor-default'}
            aria-label={`${value}점`}
          >
            <Star
              size={size}
              className={filled ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
            />
          </Tag>
        )
      })}
    </div>
  )
}

export default StarRating
