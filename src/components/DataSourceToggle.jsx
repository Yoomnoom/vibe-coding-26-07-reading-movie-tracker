const SOURCES = [
  { value: 'notion', label: 'Notion' },
  { value: 'sheets', label: 'Google Sheets' },
]

function DataSourceToggle({ source, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {SOURCES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChange(s.value)}
          className={`px-3 py-1.5 text-sm cursor-pointer ${
            source === s.value
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

export default DataSourceToggle
