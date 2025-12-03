interface NoResultsProps {
  query: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onClear?: () => void;
}

const DEFAULT_SUGGESTIONS = ['Pizza', 'Coca-Cola', 'Milch', 'Käse', 'Bier'];

export default function NoResults({
  query,
  suggestions = DEFAULT_SUGGESTIONS,
  onSuggestionClick,
  onClear,
}: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-4 h-16 w-16 text-gray-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <h3 className="mb-2 text-lg font-medium text-gray-900">
        Không tìm thấy kết quả cho &quot;{query}&quot;
      </h3>

      <p className="mb-6 max-w-md text-gray-500">
        Thử tìm kiếm với từ khóa khác hoặc duyệt theo danh mục
      </p>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-sm text-gray-500">Gợi ý tìm kiếm:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick?.(suggestion)}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Xóa tìm kiếm
        </button>
      )}
    </div>
  );
}
