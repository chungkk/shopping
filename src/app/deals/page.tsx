'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DealList from '@/components/DealList';
import SupermarketSelector, { Supermarket } from '@/components/SupermarketSelector';
import CategoryFilter, { Category } from '@/components/CategoryFilter';
import Pagination from '@/components/Pagination';
import StaleDataWarning from '@/components/StaleDataWarning';
import EmptyState from '@/components/EmptyState';
import SearchBar from '@/components/SearchBar';
import NoResults from '@/components/NoResults';
import DealModal from '@/components/DealModal';
import MobileFilterDrawer from '@/components/MobileFilterDrawer';
import { DealCardProps } from '@/components/DealCard';
import { DealDetailData } from '@/components/DealDetail';

interface DealsResponse {
  success: boolean;
  data: DealCardProps['deal'][];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface StatusResponse {
  success: boolean;
  data: {
    supermarket?: { name: string; slug: string };
    crawlStatus: string;
    lastDealsUpdate: string | null;
    isStale: boolean;
    activeDeals: number;
  };
}

interface SupermarketsResponse {
  success: boolean;
  data: Supermarket[];
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface SearchResponse {
  success: boolean;
  data: DealCardProps['deal'][];
  query: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface DealDetailResponse {
  success: boolean;
  data: DealDetailData;
}

export default function DealsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [deals, setDeals] = useState<DealCardProps['deal'][]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 30,
  });
  const [status, setStatus] = useState<StatusResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealDetailData | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const supermarketSlug = searchParams.get('supermarket');
  const categoryId = searchParams.get('category');
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sort') || 'discount';
  const urlSearchQuery = searchParams.get('q') || '';

  const fetchSupermarkets = useCallback(async () => {
    try {
      const res = await fetch('/api/supermarkets');
      const data: SupermarketsResponse = await res.json();
      if (data.success) {
        setSupermarkets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch supermarkets:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (supermarketSlug) params.set('supermarket', supermarketSlug);
      params.set('includeCount', 'true');

      const res = await fetch(`/api/categories?${params.toString()}`);
      const data: CategoriesResponse = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, [supermarketSlug]);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (supermarketSlug) params.set('supermarket', supermarketSlug);
      if (categoryId) params.set('category', categoryId);
      params.set('page', String(currentPage));
      params.set('limit', '30');
      params.set('sort', sortBy);

      const res = await fetch(`/api/deals?${params.toString()}`);
      const data: DealsResponse = await res.json();

      if (data.success) {
        setDeals(data.data);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          limit: data.pagination.limit,
        });
      } else {
        setError('Không thể tải dữ liệu khuyến mãi');
      }
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      setError('Không thể tải dữ liệu khuyến mãi');
    } finally {
      setIsLoading(false);
    }
  }, [supermarketSlug, categoryId, currentPage, sortBy]);

  const fetchStatus = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (supermarketSlug) params.set('supermarket', supermarketSlug);

      const res = await fetch(`/api/status?${params.toString()}`);
      const data: StatusResponse = await res.json();

      if (data.success) {
        setStatus(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, [supermarketSlug]);

  const fetchSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchQuery('');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('q', query);
      if (supermarketSlug) params.set('supermarket', supermarketSlug);
      if (categoryId) params.set('category', categoryId);
      params.set('page', String(currentPage));
      params.set('limit', '30');

      const res = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await res.json();

      if (data.success) {
        setDeals(data.data);
        setSearchQuery(query);
        setPagination({
          page: data.pagination.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          limit: data.pagination.limit,
        });
      } else {
        setError('Không thể tìm kiếm');
      }
    } catch (err) {
      console.error('Failed to search:', err);
      setError('Không thể tìm kiếm');
    } finally {
      setIsSearching(false);
    }
  }, [supermarketSlug, categoryId, currentPage]);

  useEffect(() => {
    if (urlSearchQuery) {
      setSearchInput(urlSearchQuery);
      setSearchQuery(urlSearchQuery);
    }
  }, [urlSearchQuery]);

  useEffect(() => {
    fetchSupermarkets();
  }, [fetchSupermarkets]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (searchQuery) {
      fetchSearch(searchQuery);
    } else {
      fetchDeals();
    }
    fetchStatus();
  }, [fetchDeals, fetchSearch, fetchStatus, searchQuery]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/deals?${params.toString()}`);
  };

  const handleSupermarketChange = (slug: string | null) => {
    setSearchQuery('');
    setSearchInput('');
    updateParams({ supermarket: slug, category: null, q: null, page: '1' });
  };

  const handleCategoryChange = (catId: string | null) => {
    setSearchQuery('');
    setSearchInput('');
    updateParams({ category: catId, q: null, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page: String(page) });
  };

  const handleSortChange = (newSort: string) => {
    updateParams({ sort: newSort, page: '1' });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    updateParams({ supermarket: null, category: null, q: null, page: '1' });
  };

  const handleSearch = (query: string) => {
    if (query.length >= 2) {
      setSearchQuery(query);
      updateParams({ q: query, page: '1' });
    } else if (query.length === 0) {
      setSearchQuery('');
      updateParams({ q: null, page: '1' });
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setSearchInput('');
    updateParams({ q: null, page: '1' });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    handleSearch(suggestion);
  };

  const handleDealClick = async (deal: DealCardProps['deal']) => {
    setModalOpen(true);
    setIsLoadingDeal(true);
    setSelectedDeal(null);

    try {
      const res = await fetch(`/api/deals/${deal._id}`);
      const data: DealDetailResponse = await res.json();

      if (data.success) {
        setSelectedDeal(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch deal details:', err);
    } finally {
      setIsLoadingDeal(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDeal(null);
  };

  const selectedSupermarket = supermarkets.find((s) => s.slug === supermarketSlug);
  const selectedCategory = categories.find((c) => c._id === categoryId);

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {selectedSupermarket ? `Khuyến mãi ${selectedSupermarket.name}` : 'Tất cả khuyến mãi'}
        </h1>
        <p className="text-gray-600">
          {pagination.total > 0
            ? `${pagination.total} sản phẩm đang giảm giá`
            : 'Đang tải...'}
        </p>
      </div>

      {status?.isStale && (
        <StaleDataWarning lastUpdated={status.lastDealsUpdate} className="mb-4" />
      )}

      <div className="mb-6">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearch}
          isLoading={isSearching}
          placeholder="Tìm sản phẩm khuyến mãi..."
        />
      </div>

      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc & Sắp xếp
          {(supermarketSlug || categoryId) && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {[supermarketSlug, categoryId].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      <div className="mb-6 hidden flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
        <SupermarketSelector
          supermarkets={supermarkets}
          selected={supermarketSlug}
          onSelect={handleSupermarketChange}
        />

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sắp xếp:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="discount">Giảm giá nhiều nhất</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
            <option value="endDate">Sắp hết hạn</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 hidden lg:block">
          <h3 className="mb-3 text-sm font-medium text-gray-700">Danh mục:</h3>
          <CategoryFilter
            categories={categories}
            selected={categoryId}
            onSelect={handleCategoryChange}
            showCount
          />
        </div>
      )}

      {searchQuery && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Kết quả cho &quot;{searchQuery}&quot;
          </span>
          <button
            type="button"
            onClick={handleSearchClear}
            className="text-sm text-blue-600 hover:underline"
          >
            Xóa tìm kiếm
          </button>
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => (searchQuery ? fetchSearch(searchQuery) : fetchDeals())}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      ) : !isLoading && !isSearching && deals.length === 0 ? (
        searchQuery ? (
          <NoResults
            query={searchQuery}
            onSuggestionClick={handleSuggestionClick}
            onClear={handleSearchClear}
          />
        ) : (
          <EmptyState
            title={categoryId ? 'Không có khuyến mãi trong danh mục này' : 'Không có khuyến mãi nào'}
            message={
              categoryId
                ? `Danh mục "${selectedCategory?.nameVi || 'này'}" chưa có khuyến mãi. Thử chọn danh mục khác.`
                : 'Chưa có dữ liệu khuyến mãi. Vui lòng thử lại sau.'
            }
            icon="category"
            action={
              categoryId || supermarketSlug
                ? { label: 'Xóa bộ lọc', onClick: handleClearFilters }
                : undefined
            }
          />
        )
      ) : (
        <>
          <DealList deals={deals} isLoading={isLoading} onDealClick={handleDealClick} />

          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      <DealModal
        deal={selectedDeal}
        isOpen={modalOpen}
        isLoading={isLoadingDeal}
        onClose={handleCloseModal}
      />

      <MobileFilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        categories={categories}
        selectedCategory={categoryId}
        onCategorySelect={handleCategoryChange}
        supermarkets={supermarkets}
        selectedSupermarket={supermarketSlug}
        onSupermarketSelect={handleSupermarketChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        onClearAll={handleClearFilters}
      />
    </div>
  );
}
