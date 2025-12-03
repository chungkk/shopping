interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: 'search' | 'category' | 'deals';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title = 'Không tìm thấy kết quả',
  message = 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm',
  icon = 'deals',
  action,
}: EmptyStateProps) {
  const icons = {
    search: (
      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    category: (
      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
    deals: (
      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-gray-300">{icons[icon]}</div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
      <p className="mb-6 max-w-md text-gray-500">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
