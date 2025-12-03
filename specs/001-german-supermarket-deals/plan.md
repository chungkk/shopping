# Implementation Plan: German Supermarket Deals Aggregator

**Branch**: `001-german-supermarket-deals` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-german-supermarket-deals/spec.md`

## Summary

Xây dựng trang web tổng hợp khuyến mãi từ các siêu thị Đức (bắt đầu với Globus) sử dụng Next.js cho frontend/backend và MongoDB để lưu trữ dữ liệu sản phẩm và khuyến mãi. Hệ thống bao gồm crawler để thu thập dữ liệu từ website siêu thị và giao diện tiếng Việt cho người dùng.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20.x LTS  
**Framework**: Next.js 14 (App Router)  
**Primary Dependencies**: 
- Puppeteer/Playwright (web crawling)
- Mongoose (MongoDB ODM)
- Tailwind CSS (styling)
- next-intl hoặc i18n (Vietnamese localization)

**Storage**: MongoDB Atlas (cloud) hoặc MongoDB local  
**Testing**: Jest + React Testing Library, Playwright E2E  
**Target Platform**: Web (Desktop + Mobile responsive)  
**Project Type**: Web application (monorepo với crawler service)  
**Performance Goals**: Page load < 3s, Search < 2s, Support 1000 concurrent users  
**Constraints**: Crawl politely (2-5s delay), retry mỗi 1 giờ khi lỗi  
**Scale/Scope**: ~10,000 products initially, expandable to 9 supermarkets

## Constitution Check

*GATE: Pass - No specific constitution rules defined for this project*

## Project Structure

### Documentation (this feature)

```text
specs/001-german-supermarket-deals/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API specs)
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (từ /speckit.tasks)
```

### Source Code (repository root)

```text
shopping-deals/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   ├── deals/
│   │   │   └── page.tsx        # Deals listing
│   │   └── api/
│   │       ├── deals/
│   │       │   └── route.ts    # GET /api/deals
│   │       ├── products/
│   │       │   └── route.ts    # GET /api/products
│   │       ├── categories/
│   │       │   └── route.ts    # GET /api/categories
│   │       └── crawl/
│   │           └── route.ts    # POST /api/crawl (trigger)
│   │
│   ├── components/
│   │   ├── DealCard.tsx
│   │   ├── DealList.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Pagination.tsx
│   │   ├── SupermarketSelector.tsx
│   │   └── StaleDataWarning.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── mongodb.ts      # MongoDB connection
│   │   │   └── models/
│   │   │       ├── Product.ts
│   │   │       ├── Deal.ts
│   │   │       ├── Category.ts
│   │   │       └── Supermarket.ts
│   │   │
│   │   ├── crawler/
│   │   │   ├── base.ts         # Base crawler class
│   │   │   ├── globus/
│   │   │   │   ├── products.ts # Full catalog crawler
│   │   │   │   └── deals.ts    # Weekly flyer crawler
│   │   │   └── scheduler.ts    # Cron job scheduler
│   │   │
│   │   └── utils/
│   │       ├── price.ts        # Price parsing utilities
│   │       └── date.ts         # Date utilities
│   │
│   └── i18n/
│       └── vi.json             # Vietnamese translations
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── public/
│   └── images/
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.example
```

**Structure Decision**: Web application với Next.js App Router, MongoDB làm database, và crawler module tích hợp. Monorepo đơn giản vì crawler và web app chia sẻ models.

## Complexity Tracking

> Không có violation nào cần justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
