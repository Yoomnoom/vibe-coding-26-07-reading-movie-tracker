function EntryCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[3/4] w-full bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-200" />
      </div>
    </div>
  )
}

export default EntryCardSkeleton
