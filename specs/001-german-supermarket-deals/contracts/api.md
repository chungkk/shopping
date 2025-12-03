# API Contracts: German Supermarket Deals Aggregator

**Date**: 2025-12-03  
**Base URL**: `/api`

## Overview

REST API endpoints cho Next.js App Router.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/supermarkets | Danh sách siêu thị |
| GET | /api/categories | Danh mục sản phẩm |
| GET | /api/deals | Danh sách khuyến mãi |
| GET | /api/deals/[id] | Chi tiết khuyến mãi |
| GET | /api/products | Danh sách sản phẩm |
| GET | /api/search | Tìm kiếm |
| GET | /api/status | Trạng thái hệ thống |
| POST | /api/crawl | Trigger crawl (admin) |

---

## 1. GET /api/supermarkets

Lấy danh sách các siêu thị được hỗ trợ.

### Response 200
```typescript
interface SupermarketsResponse {
  data: {
    id: string;
    name: string;
    slug: string;
    logo: string;
    isActive: boolean;
    lastUpdated: string | null;  // ISO datetime
    dealCount: number;
  }[];
}
```

### Example
```json
{
  "data": [
    {
      "id": "6570a1b2c3d4e5f6a7b8c9d0",
      "name": "Globus",
      "slug": "globus",
      "logo": "/images/supermarkets/globus.png",
      "isActive": true,
      "lastUpdated": "2025-12-03T06:00:00Z",
      "dealCount": 245
    }
  ]
}
```

---

## 2. GET /api/categories

Lấy danh mục sản phẩm theo siêu thị.

### Query Parameters
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| supermarket | string | Yes | Supermarket slug (e.g., "globus") |

### Response 200
```typescript
interface CategoriesResponse {
  data: {
    id: string;
    name: string;
    nameVi: string;
    slug: string;
    parentId: string | null;
    productCount: number;
    iconUrl?: string;
  }[];
}
```

### Example
```json
{
  "data": [
    {
      "id": "cat_001",
      "name": "Getränke",
      "nameVi": "Đồ uống",
      "slug": "getraenke",
      "parentId": null,
      "productCount": 523,
      "iconUrl": "/icons/drinks.svg"
    },
    {
      "id": "cat_002",
      "name": "Obst & Gemüse",
      "nameVi": "Rau củ quả",
      "slug": "obst-gemuese",
      "parentId": null,
      "productCount": 312
    }
  ]
}
```

---

## 3. GET /api/deals

Lấy danh sách khuyến mãi với filter và pagination.

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| supermarket | string | Yes | - | Supermarket slug |
| category | string | No | - | Category slug |
| page | number | No | 1 | Page number |
| limit | number | No | 30 | Items per page (max: 100) |
| sort | string | No | "discount" | Sort: "discount", "price", "endDate", "name" |
| order | string | No | "desc" | Order: "asc", "desc" |
| active | boolean | No | true | Filter active/expired deals |

### Response 200
```typescript
interface DealsResponse {
  data: Deal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    lastUpdated: string;      // ISO datetime
    isStale: boolean;         // true if > 24h old
  };
}

interface Deal {
  id: string;
  productName: string;
  productBrand?: string;
  productImageUrl: string;
  categoryId: string;
  categoryName: string;
  currentPrice: number;       // cents
  currentPriceFormatted: string;  // "1,99 €"
  originalPrice: number | null;
  originalPriceFormatted: string | null;
  discountPercent: number | null;
  unitType: string;
  unitPrice?: number;
  unitPriceFormatted?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  source: string;
  sourceRef: string;
}
```

### Example Request
```
GET /api/deals?supermarket=globus&category=getraenke&page=1&limit=30&sort=discount
```

### Example Response
```json
{
  "data": [
    {
      "id": "deal_001",
      "productName": "Coca-Cola Classic 1,5L",
      "productBrand": "Coca-Cola",
      "productImageUrl": "https://produkte.globus.de/media/.../coca-cola.jpg",
      "categoryId": "cat_001",
      "categoryName": "Getränke",
      "currentPrice": 99,
      "currentPriceFormatted": "0,99 €",
      "originalPrice": 149,
      "originalPriceFormatted": "1,49 €",
      "discountPercent": 34,
      "unitType": "piece",
      "unitPrice": 66,
      "unitPriceFormatted": "0,66 € / 1L",
      "startDate": "2025-12-02T00:00:00Z",
      "endDate": "2025-12-07T23:59:59Z",
      "isActive": true,
      "isExpired": false,
      "source": "flyer",
      "sourceRef": "KW49"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 245,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "lastUpdated": "2025-12-03T06:00:00Z",
    "isStale": false
  }
}
```

---

## 4. GET /api/deals/[id]

Lấy chi tiết một khuyến mãi.

### Response 200
```typescript
interface DealDetailResponse {
  data: Deal & {
    description?: string;
    images: string[];
    sourceUrl?: string;
    product?: {
      id: string;
      basePrice: number;
      basePriceFormatted: string;
    };
  };
}
```

### Response 404
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Deal not found"
  }
}
```

---

## 5. GET /api/products

Lấy danh sách sản phẩm từ catalog (không phải deals).

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| supermarket | string | Yes | - | Supermarket slug |
| category | string | No | - | Category slug |
| page | number | No | 1 | Page number |
| limit | number | No | 30 | Items per page |

### Response 200
```typescript
interface ProductsResponse {
  data: {
    id: string;
    name: string;
    brand?: string;
    imageUrl: string;
    categoryId: string;
    categoryName: string;
    basePrice: number;
    basePriceFormatted: string;
    unitType: string;
    unitPrice?: number;
    unitPriceFormatted?: string;
    isAvailable: boolean;
    hasDeal: boolean;
  }[];
  pagination: Pagination;
}
```

---

## 6. GET /api/search

Tìm kiếm deals và sản phẩm.

### Query Parameters
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| q | string | Yes | - | Search query |
| supermarket | string | No | - | Filter by supermarket |
| type | string | No | "deals" | "deals", "products", "all" |
| page | number | No | 1 | Page number |
| limit | number | No | 30 | Items per page |

### Response 200
```typescript
interface SearchResponse {
  data: {
    deals: Deal[];
    products: Product[];
  };
  pagination: Pagination;
  meta: {
    query: string;
    totalResults: number;
  };
}
```

### Example
```
GET /api/search?q=Pizza&supermarket=globus&type=deals
```

---

## 7. GET /api/status

Kiểm tra trạng thái hệ thống và thời gian crawl.

### Response 200
```typescript
interface StatusResponse {
  status: 'ok' | 'degraded' | 'error';
  supermarkets: {
    slug: string;
    name: string;
    lastProductsCrawl: string | null;
    lastDealsCrawl: string | null;
    crawlStatus: 'success' | 'failed' | 'pending' | 'running';
    isStale: boolean;
    errorMessage?: string;
  }[];
  timestamp: string;
}
```

---

## 8. POST /api/crawl (Admin Only)

Trigger crawl thủ công.

### Request Body
```typescript
interface CrawlRequest {
  supermarket: string;   // Supermarket slug
  type: 'products' | 'deals' | 'all';
}
```

### Response 202
```json
{
  "message": "Crawl started",
  "jobId": "job_abc123"
}
```

### Response 401
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Admin access required"
  }
}
```

---

## Error Responses

### Standard Error Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| BAD_REQUEST | 400 | Invalid parameters |
| UNAUTHORIZED | 401 | Authentication required |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- Public endpoints: 100 requests/minute per IP
- Search: 30 requests/minute per IP
- Admin endpoints: 10 requests/minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701590400
```
