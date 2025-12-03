# Research: German Supermarket Deals Aggregator

**Date**: 2025-12-03  
**Feature**: 001-german-supermarket-deals

## 1. Web Crawling Strategy for Globus

### Decision: Puppeteer với polite crawling

### Rationale:
- Globus website (produkte.globus.de) là JavaScript-rendered SPA, cần headless browser
- Puppeteer có ecosystem mạnh với Node.js/Next.js
- Hỗ trợ tốt cho việc chờ elements load và handle dynamic content

### Alternatives Considered:
- **Cheerio**: Rejected - không handle được JavaScript-rendered content
- **Playwright**: Viable alternative, nhưng Puppeteer đủ cho use case này
- **Scrapy (Python)**: Rejected - muốn giữ monorepo TypeScript

### Implementation Notes:
```typescript
// Polite crawling config
const CRAWL_DELAY_MS = 3000; // 3 seconds between requests
const MAX_RETRIES = 3;
const RETRY_INTERVAL_MS = 3600000; // 1 hour
```

## 2. MongoDB Schema Design

### Decision: Denormalized schema với embedded documents cho performance

### Rationale:
- Deals cần query nhanh với filter theo category, supermarket
- Product data ít thay đổi, có thể embed một số fields vào Deal
- MongoDB Atlas free tier đủ cho 10k products

### Schema Strategy:
- **Products**: Standalone collection, cập nhật khi full crawl
- **Deals**: Standalone với product reference, cập nhật daily
- **Categories**: Embedded trong Products, separate collection cho filter UI
- **Supermarkets**: Config collection, ít thay đổi

### Indexes:
```javascript
// Deals collection
{ supermarketId: 1, isActive: 1, endDate: -1 }
{ categoryId: 1, isActive: 1 }
{ productName: "text" } // Text search

// Products collection
{ supermarketId: 1, categoryId: 1 }
{ externalId: 1, supermarketId: 1 } // Unique constraint
```

## 3. Next.js App Router API Design

### Decision: Route Handlers với Server Components

### Rationale:
- App Router là hướng đi của Next.js, tốt cho SEO
- Server Components giảm client-side JavaScript
- Route Handlers đơn giản cho API endpoints

### API Patterns:
- GET endpoints cho read operations
- POST /api/crawl để trigger manual crawl (admin only)
- Server-side pagination, filtering

## 4. Crawl Data Sources Analysis

### Globus Product Catalog (produkte.globus.de)

**Structure discovered**:
- Categories trong menu: Getränke, Obst & Gemüse, Fleisch & Fisch, etc.
- Product cards có: image, name, price, unit price
- Pagination via infinite scroll hoặc category pages

**Selectors (example)**:
```typescript
const SELECTORS = {
  productCard: '.product-card, [data-product]',
  productName: '.product-name, h2, h3',
  productPrice: '.price, .product-price',
  productImage: 'img[src*="media"], .product-image img',
  categoryLink: '.category-link, nav a[href*="produkte"]'
};
```

### Globus Weekly Flyer (aktuelles-prospekt.php)

**Structure discovered**:
- PDF viewer với download links
- PDF URLs: `Faltblatt_KW{week}_Seite_{page}.pdf`
- Alternative: Parse the interactive viewer elements

**Strategy**: 
1. Ưu tiên scrape từ web viewer nếu có structured data
2. Fallback: Download PDF và parse với pdf-parse library

## 5. Vietnamese Localization

### Decision: Static translations với next-intl

### Rationale:
- UI strings cố định (không cần dynamic translation)
- Product names giữ nguyên tiếng Đức
- next-intl tích hợp tốt với App Router

### Translation scope:
- Navigation labels
- Filter labels (Danh mục, Tìm kiếm, etc.)
- Status messages (Đã hết hạn, Cập nhật lần cuối, etc.)
- Empty states, error messages

## 6. Cron Job / Scheduler

### Decision: Vercel Cron hoặc node-cron cho self-hosted

### Rationale:
- Vercel Cron đơn giản nếu deploy trên Vercel
- node-cron cho local development và self-hosted

### Schedule:
```
# Daily full deals crawl
0 6 * * * # 6 AM daily

# Retry on failure
# Handled in code: retry every 1 hour up to 3 times
```

## 7. Error Handling & Resilience

### Crawl Failures:
1. Log error với timestamp
2. Set `lastCrawlStatus: 'failed'` trong database
3. Schedule retry sau 1 giờ
4. UI hiển thị warning với last successful update time

### Data Staleness:
- Track `lastUpdated` timestamp cho mỗi supermarket
- Frontend check và hiển thị warning nếu > 24h
- Expired deals: check `endDate` và set `isActive: false`

## 8. Performance Optimization

### Database:
- Compound indexes cho common queries
- Projection: chỉ fetch fields cần thiết
- Pagination: limit 30, skip-based

### Frontend:
- Image optimization với next/image
- Server Components cho initial render
- Client-side caching với SWR hoặc React Query

## Summary of Technical Decisions

| Area | Decision | Key Reason |
|------|----------|------------|
| Crawler | Puppeteer | JS-rendered content |
| Database | MongoDB | Flexible schema, good for products |
| ORM | Mongoose | TypeScript support, validation |
| Framework | Next.js 14 App Router | SSR, API routes, modern |
| Styling | Tailwind CSS | Rapid UI development |
| i18n | next-intl | App Router integration |
| Scheduler | Vercel Cron / node-cron | Platform-dependent |
