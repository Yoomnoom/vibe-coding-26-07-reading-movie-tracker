import { useState } from 'react'
import { BookOpen, Film } from 'lucide-react'

function CoverImage({ coverUrl, type, title }) {
  const [failed, setFailed] = useState(false)
  const aspectClass = type === 'book' ? 'aspect-[3/4]' : 'aspect-video'

  if (!coverUrl || failed) {
    return (
      <div
        className={`${aspectClass} w-full flex items-center justify-center bg-gray-100 text-gray-300`}
      >
        {type === 'book' ? <BookOpen size={40} /> : <Film size={40} />}
      </div>
    )
  }

  return (
    <div className={`${aspectClass} w-full overflow-hidden bg-gray-100`}>
      <img
        src={coverUrl}
        alt={title}
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
    </div>
  )
}

export default CoverImage
