'use client';

export interface Category {
  _id: string;
  name: string;
  nameVi: string;
  slug: string;
  dealCount?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string | null;
  onSelect: (categoryId: string | null) => void;
  showCount?: boolean;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
  showCount = false,
}: CategoryFilterProps) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex gap-2 pb-2 sm:flex-wrap sm:pb-0">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            selected === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>

        {categories.map((category) => (
          <button
            key={category._id}
            type="button"
            onClick={() => onSelect(category._id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              selected === category._id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.nameVi}
            {showCount && category.dealCount !== undefined && (
              <span className="ml-1 text-xs opacity-75">({category.dealCount})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
