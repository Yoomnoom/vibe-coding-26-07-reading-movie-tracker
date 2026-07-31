import { Plus, Search } from 'lucide-react'
import DataSourceToggle from './DataSourceToggle'

const FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'book', label: '책' },
  { value: 'movie', label: '영화' },
]

const SORTS = [
  { value: 'date', label: '완료일순' },
  { value: 'rating', label: '평점순' },
]

function Toolbar({
  dataSource,
  onDataSourceChange,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  onAddClick,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <DataSourceToggle source={dataSource} onChange={onDataSourceChange} />

        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="제목 검색"
            className="rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`px-3 py-1.5 text-sm cursor-pointer ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 cursor-pointer"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onAddClick}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer"
      >
        <Plus size={16} />새 기록 추가
      </button>
    </div>
  )
}

export default Toolbar
