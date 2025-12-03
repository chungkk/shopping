# Data Model: German Supermarket Deals Aggregator

**Date**: 2025-12-03  
**Database**: MongoDB

## Collections Overview

```
┌─────────────────┐     ┌─────────────────┐
│   Supermarket   │     │    Category     │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │ 1:N                   │ 1:N
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│    Product      │◄────│      Deal       │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────────────────────┘
              N:1 (Deal references Product)
```

## 1. Supermarket Collection

Lưu thông tin về các chuỗi siêu thị.

```typescript
interface Supermarket {
  _id: ObjectId;
  name: string;                    // "Globus"
  slug: string;                    // "globus"
  logo: string;                    // URL to logo image
  website: string;                 // "https://www.globus.de"
  productCatalogUrl: string;       // "https://produkte.globus.de"
  flyerUrl: string;                // "https://www.globus.de/.../aktuelles-prospekt.php"
  locations: Location[];           // Array of store locations
  isActive: boolean;               // Enable/disable crawling
  crawlConfig: {
    delayMs: number;               // Delay between requests (default: 3000)
    userAgent: string;             // Custom user agent
    selectors: Record<string, string>; // CSS selectors for crawling
  };
  lastCrawl: {
    productsAt: Date | null;       // Last full product crawl
    dealsAt: Date | null;          // Last deals crawl
    status: 'success' | 'failed' | 'pending';
    errorMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Location {
  name: string;                    // "Halle-Dieselstraße"
  slug: string;                    // "halle-dieselstrasse"
  address: string;
  flyerUrl: string;                // Location-specific flyer URL
}
```

**Indexes**:
```javascript
{ slug: 1 }                        // Unique
{ isActive: 1 }
```

## 2. Category Collection

Lưu danh mục sản phẩm theo từng siêu thị.

```typescript
interface Category {
  _id: ObjectId;
  supermarketId: ObjectId;         // Reference to Supermarket
  name: string;                    // "Getränke"
  nameVi: string;                  // "Đồ uống" (Vietnamese translation)
  slug: string;                    // "getraenke"
  parentId: ObjectId | null;       // For subcategories
  externalId: string;              // ID từ website gốc
  iconUrl?: string;                // Category icon
  sortOrder: number;               // Display order
  productCount: number;            // Cached count
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
{ supermarketId: 1, slug: 1 }      // Unique compound
{ supermarketId: 1, sortOrder: 1 }
{ parentId: 1 }
```

## 3. Product Collection

Lưu thông tin sản phẩm từ catalog.

```typescript
interface Product {
  _id: ObjectId;
  supermarketId: ObjectId;         // Reference to Supermarket
  categoryId: ObjectId;            // Reference to Category
  externalId: string;              // Product ID từ website gốc (e.g., EAN/GTIN)
  name: string;                    // "Coca-Cola Classic"
  brand?: string;                  // "Coca-Cola"
  description?: string;
  imageUrl: string;                // Main product image
  images: string[];                // Additional images
  
  // Pricing
  basePrice: number;               // Regular price in EUR (cents)
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml';
  unitPrice?: number;              // Price per unit (e.g., per kg)
  unitPriceText?: string;          // "2,99 € / 1 kg"
  
  // Metadata
  sourceUrl: string;               // URL where product was found
  isAvailable: boolean;
  
  // Timestamps
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
{ supermarketId: 1, externalId: 1 }  // Unique compound
{ supermarketId: 1, categoryId: 1 }
{ name: "text", brand: "text" }       // Text search
{ isAvailable: 1 }
```

## 4. Deal Collection

Lưu thông tin khuyến mãi/giảm giá.

```typescript
interface Deal {
  _id: ObjectId;
  supermarketId: ObjectId;         // Reference to Supermarket
  productId: ObjectId | null;      // Reference to Product (nullable if not matched)
  categoryId: ObjectId;            // Reference to Category
  locationSlug?: string;           // Specific location if applicable
  
  // Product info (denormalized for query performance)
  productName: string;             // "Coca-Cola Classic 1,5L"
  productBrand?: string;
  productImageUrl: string;
  
  // Pricing
  currentPrice: number;            // Sale price in EUR (cents)
  originalPrice: number | null;    // Original price (null if unknown)
  discountPercent: number | null;  // Calculated discount %
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml';
  unitPrice?: number;
  priceText: string;               // "1,99 €" (display format)
  originalPriceText?: string;      // "2,99 €"
  
  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;               // Computed: now between start and end
  
  // Source
  source: 'flyer' | 'website' | 'api';
  sourceRef: string;               // e.g., "KW49", flyer page number
  sourceUrl?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
```javascript
{ supermarketId: 1, isActive: 1, endDate: -1 }  // Main query
{ supermarketId: 1, categoryId: 1, isActive: 1 }
{ productName: "text" }                          // Text search
{ endDate: 1 }                                   // For expiration check
{ productId: 1 }                                 // Link to products
```

## 5. CrawlLog Collection (Optional)

Theo dõi lịch sử crawl để debug.

```typescript
interface CrawlLog {
  _id: ObjectId;
  supermarketId: ObjectId;
  type: 'products' | 'deals';
  status: 'started' | 'success' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;               // milliseconds
  
  stats: {
    pagesProcessed: number;
    itemsFound: number;
    itemsCreated: number;
    itemsUpdated: number;
    errors: number;
  };
  
  errorDetails?: {
    message: string;
    stack?: string;
    failedUrls?: string[];
  };
}
```

**Indexes**:
```javascript
{ supermarketId: 1, startedAt: -1 }
{ status: 1 }
```

## Validation Rules

### Price Validation
- `currentPrice` > 0
- `originalPrice` > `currentPrice` (when both exist)
- `discountPercent` = ((originalPrice - currentPrice) / originalPrice) * 100

### Date Validation
- `endDate` >= `startDate`
- `isActive` = `startDate` <= now <= `endDate`

### Required Fields
- Product: name, supermarketId, categoryId, externalId, imageUrl
- Deal: productName, supermarketId, categoryId, currentPrice, startDate, endDate
- Category: name, supermarketId, slug
- Supermarket: name, slug, website

## State Transitions

### Deal Lifecycle
```
[Created] → [Active] → [Expired]
              ↑
              └── isActive computed from dates
```

### Crawl Status
```
[Pending] → [Running] → [Success]
                │
                └─────→ [Failed] → retry after 1 hour
```

## Sample Queries

### Lấy deals đang active theo supermarket
```javascript
db.deals.find({
  supermarketId: ObjectId("..."),
  isActive: true,
  endDate: { $gte: new Date() }
}).sort({ discountPercent: -1 }).limit(30)
```

### Tìm kiếm deals theo tên
```javascript
db.deals.find({
  $text: { $search: "Pizza" },
  isActive: true
})
```

### Lấy deals theo category
```javascript
db.deals.find({
  supermarketId: ObjectId("..."),
  categoryId: ObjectId("..."),
  isActive: true
}).sort({ endDate: 1 })
```
