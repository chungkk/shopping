# Tasks: German Supermarket Deals Aggregator

**Input**: Design documents from `/specs/001-german-supermarket-deals/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create Next.js project with TypeScript, Tailwind, App Router in `shopping-deals/`
- [x] T002 Install dependencies: mongoose, puppeteer, next-intl in `shopping-deals/package.json`
- [x] T003 [P] Create `.env.example` with MONGODB_URI, CRAWL_DELAY_MS, ADMIN_API_KEY
- [x] T004 [P] Configure TypeScript paths in `shopping-deals/tsconfig.json`
- [x] T005 [P] Setup Tailwind config for Vietnamese fonts in `shopping-deals/src/app/globals.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Models

- [x] T006 Setup MongoDB connection singleton in `shopping-deals/src/lib/db/mongodb.ts`
- [x] T007 [P] Create Supermarket model with crawlConfig and lastCrawl in `shopping-deals/src/lib/db/models/Supermarket.ts`
- [x] T008 [P] Create Category model with nameVi field in `shopping-deals/src/lib/db/models/Category.ts`
- [x] T009 [P] Create Product model with pricing fields in `shopping-deals/src/lib/db/models/Product.ts`
- [x] T010 [P] Create Deal model with denormalized product info in `shopping-deals/src/lib/db/models/Deal.ts`
- [x] T011 [P] Create CrawlLog model for debugging in `shopping-deals/src/lib/db/models/CrawlLog.ts`

### Utilities & i18n

- [x] T012 [P] Create price parsing utilities (cents, format) in `shopping-deals/src/lib/utils/price.ts`
- [x] T013 [P] Create date utilities (validity check, format) in `shopping-deals/src/lib/utils/date.ts`
- [x] T014 [P] Create Vietnamese translations file in `shopping-deals/src/i18n/vi.json`
- [x] T015 Setup next-intl configuration in `shopping-deals/next.config.js`

### Crawler Base

- [x] T016 Create base crawler class with polite crawling in `shopping-deals/src/lib/crawler/base.ts`
- [x] T017 Create Globus product catalog crawler in `shopping-deals/src/lib/crawler/globus/products.ts`
- [x] T018 Create Globus weekly flyer deals crawler in `shopping-deals/src/lib/crawler/globus/deals.ts`
- [x] T019 Create crawler scheduler with retry logic in `shopping-deals/src/lib/crawler/scheduler.ts`

### Seed Data

- [x] T020 Create seed script for Globus supermarket config in `shopping-deals/scripts/seed-supermarket.ts`
- [x] T021 Create seed script for Globus categories in `shopping-deals/scripts/seed-categories.ts`

**Checkpoint**: Foundation ready - run seed scripts, verify DB connection

---

## Phase 3: User Story 1 - View Today's Deals at Globus (Priority: P1) 🎯 MVP

**Goal**: Users can see all current Globus deals with prices, images, discount %, and validity dates

**Independent Test**: Load `/deals?supermarket=globus` and verify deals display with all required info

### API Endpoints for US1

- [x] T022 [US1] Create GET /api/supermarkets route in `shopping-deals/src/app/api/supermarkets/route.ts`
- [x] T023 [US1] Create GET /api/deals route with pagination in `shopping-deals/src/app/api/deals/route.ts`
- [x] T024 [US1] Create GET /api/status route for crawl status in `shopping-deals/src/app/api/status/route.ts`

### UI Components for US1

- [x] T025 [P] [US1] Create DealCard component with price display in `shopping-deals/src/components/DealCard.tsx`
- [x] T026 [P] [US1] Create DealList component with grid layout in `shopping-deals/src/components/DealList.tsx`
- [x] T027 [P] [US1] Create SupermarketSelector dropdown in `shopping-deals/src/components/SupermarketSelector.tsx`
- [x] T028 [P] [US1] Create Pagination component in `shopping-deals/src/components/Pagination.tsx`
- [x] T029 [P] [US1] Create StaleDataWarning component in `shopping-deals/src/components/StaleDataWarning.tsx`
- [x] T030 [P] [US1] Create ExpiredDealBadge component (gray styling) in `shopping-deals/src/components/ExpiredDealBadge.tsx`

### Pages for US1

- [x] T031 [US1] Create root layout with Vietnamese locale in `shopping-deals/src/app/layout.tsx`
- [x] T032 [US1] Create homepage with supermarket selection in `shopping-deals/src/app/page.tsx`
- [x] T033 [US1] Create deals listing page in `shopping-deals/src/app/deals/page.tsx`

### Integration for US1

- [x] T034 [US1] Wire DealList to /api/deals with SWR/fetch in `shopping-deals/src/app/deals/page.tsx`
- [x] T035 [US1] Add stale data warning based on /api/status response
- [x] T036 [US1] Sort deals by discount percentage (highest first)

**Checkpoint US1**: Visit `/deals?supermarket=globus`, verify deals display with pagination, prices, images

---

## Phase 4: User Story 2 - Filter Deals by Category (Priority: P2)

**Goal**: Users can filter deals by product category (Getränke, Obst & Gemüse, etc.)

**Independent Test**: Select "Getränke" filter, verify only beverage deals show

### API Endpoints for US2

- [x] T037 [US2] Create GET /api/categories route in `shopping-deals/src/app/api/categories/route.ts`
- [x] T038 [US2] Add category filter param to GET /api/deals in `shopping-deals/src/app/api/deals/route.ts`

### UI Components for US2

- [x] T039 [P] [US2] Create CategoryFilter component with Vietnamese labels in `shopping-deals/src/components/CategoryFilter.tsx`
- [x] T040 [P] [US2] Create EmptyState component for no deals in category in `shopping-deals/src/components/EmptyState.tsx`

### Integration for US2

- [x] T041 [US2] Add CategoryFilter to deals page in `shopping-deals/src/app/deals/page.tsx`
- [x] T042 [US2] Wire category filter to API query params
- [x] T043 [US2] Show EmptyState when category has no deals

**Checkpoint US2**: Select different categories, verify filtering works, empty state displays

---

## Phase 5: User Story 3 - Search for Specific Products (Priority: P2)

**Goal**: Users can search deals by product name/keyword

**Independent Test**: Search "Pizza", verify matching deals appear

### API Endpoints for US3

- [x] T044 [US3] Create GET /api/search route with text search in `shopping-deals/src/app/api/search/route.ts`

### UI Components for US3

- [x] T045 [P] [US3] Create SearchBar component with debounce in `shopping-deals/src/components/SearchBar.tsx`
- [x] T046 [P] [US3] Create SearchResults component in `shopping-deals/src/components/SearchResults.tsx`
- [x] T047 [P] [US3] Create NoResults component with suggestions in `shopping-deals/src/components/NoResults.tsx`

### Integration for US3

- [x] T048 [US3] Add SearchBar to deals page header in `shopping-deals/src/app/deals/page.tsx`
- [x] T049 [US3] Wire search to API with 300ms debounce
- [x] T050 [US3] Clear search when changing category/supermarket

**Checkpoint US3**: Search for products, verify results, test no results state

---

## Phase 6: User Story 4 - View Product Details (Priority: P3)

**Goal**: Users can click a deal to see enlarged image, full details, validity period

**Independent Test**: Click any deal card, verify modal/page shows complete info

### API Endpoints for US4

- [x] T051 [US4] Create GET /api/deals/[id] route in `shopping-deals/src/app/api/deals/[id]/route.ts`

### UI Components for US4

- [x] T052 [P] [US4] Create DealDetail component with large image in `shopping-deals/src/components/DealDetail.tsx`
- [x] T053 [P] [US4] Create DealModal component in `shopping-deals/src/components/DealModal.tsx`
- [x] T054 [P] [US4] Create PriceDisplay component with original/current in `shopping-deals/src/components/PriceDisplay.tsx`
- [x] T055 [P] [US4] Create ValidityBadge component with dates in `shopping-deals/src/components/ValidityBadge.tsx`

### Integration for US4

- [x] T056 [US4] Add click handler to DealCard to open modal
- [x] T057 [US4] Fetch deal details on modal open
- [x] T058 [US4] Display source reference (e.g., "Wochenangebot KW49")

**Checkpoint US4**: Click deals, verify modal with full details opens

---

## Phase 7: User Story 5 - Mobile-Friendly Experience (Priority: P3)

**Goal**: Website works well on mobile devices (320px+)

**Independent Test**: Open site on mobile viewport, verify all features usable

### UI Components for US5

- [x] T059 [P] [US5] Create MobileFilterDrawer component in `shopping-deals/src/components/MobileFilterDrawer.tsx`
- [x] T060 [P] [US5] Create MobileHeader component with hamburger in `shopping-deals/src/components/MobileHeader.tsx`
- [x] T061 [P] [US5] Update DealCard for mobile touch targets in `shopping-deals/src/components/DealCard.tsx`

### Responsive Styling for US5

- [x] T062 [US5] Add responsive breakpoints to DealList grid
- [x] T063 [US5] Add mobile styles to CategoryFilter (horizontal scroll or drawer)
- [x] T064 [US5] Add mobile styles to SearchBar (full width)
- [x] T065 [US5] Add mobile styles to Pagination (simplified)

### Integration for US5

- [x] T066 [US5] Implement mobile filter toggle button
- [x] T067 [US5] Test all features at 320px, 375px, 768px viewports

**Checkpoint US5**: Test on mobile viewport, verify usability

---

## Phase 8: Crawler Execution & Admin

**Purpose**: Enable data population and admin functions

- [x] T068 Create POST /api/crawl admin route in `shopping-deals/src/app/api/crawl/route.ts`
- [x] T069 Create GET /api/products route in `shopping-deals/src/app/api/products/route.ts`
- [x] T070 Create CLI script to run initial full crawl in `shopping-deals/scripts/crawl.ts`
- [x] T071 Setup Vercel cron or node-cron for daily crawl in `shopping-deals/src/app/api/cron/crawl/route.ts`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements

- [x] T072 [P] Add loading skeletons for DealList
- [x] T073 [P] Add error boundaries and error UI
- [x] T074 [P] Optimize images with next/image
- [x] T075 [P] Add meta tags for SEO in layout.tsx
- [x] T076 Verify page load < 3s, search < 2s
- [x] T077 Run Lighthouse audit and fix issues
- [x] T078 Create sample data for demo in `shopping-deals/scripts/seed-sample-deals.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → [User Stories can proceed]
                                          ├→ Phase 3 (US1 - MVP)
                                          ├→ Phase 4 (US2 - Filter)
                                          ├→ Phase 5 (US3 - Search)
                                          ├→ Phase 6 (US4 - Details)
                                          └→ Phase 7 (US5 - Mobile)
                                          
All User Stories → Phase 8 (Crawler) → Phase 9 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (P1) | Phase 2 | T021 complete |
| US2 (P2) | US1 API routes | T024 complete |
| US3 (P2) | US1 UI components | T033 complete |
| US4 (P3) | US1 DealCard | T025 complete |
| US5 (P3) | US1-US4 components | T058 complete |

### Parallel Opportunities Per Phase

**Phase 2**: T007-T011 (all models), T012-T014 (utilities)
**US1**: T025-T030 (all components)
**US2**: T039-T040 (components)
**US3**: T045-T047 (components)
**US4**: T052-T055 (components)
**US5**: T059-T061 (components)

---

## Parallel Example: User Story 1 Components

```bash
# Launch all US1 components in parallel:
Task: "Create DealCard component in shopping-deals/src/components/DealCard.tsx"
Task: "Create DealList component in shopping-deals/src/components/DealList.tsx"
Task: "Create SupermarketSelector in shopping-deals/src/components/SupermarketSelector.tsx"
Task: "Create Pagination component in shopping-deals/src/components/Pagination.tsx"
Task: "Create StaleDataWarning in shopping-deals/src/components/StaleDataWarning.tsx"
Task: "Create ExpiredDealBadge in shopping-deals/src/components/ExpiredDealBadge.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~2 hours)
3. Complete Phase 3: User Story 1 (~3 hours)
4. **STOP and VALIDATE**: Test US1 independently
5. Run crawler to populate real data
6. Deploy MVP

### Incremental Delivery

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | View Globus deals with pagination |
| v1.1 | US1 + US2 | + Category filtering |
| v1.2 | US1-US3 | + Search |
| v1.3 | US1-US4 | + Deal details |
| v2.0 | US1-US5 | + Mobile support |

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 78 |
| Phase 1 (Setup) | 5 |
| Phase 2 (Foundational) | 16 |
| User Story 1 (MVP) | 15 |
| User Story 2 | 7 |
| User Story 3 | 7 |
| User Story 4 | 8 |
| User Story 5 | 9 |
| Phase 8 (Crawler) | 4 |
| Phase 9 (Polish) | 7 |
| Parallel Opportunities | 35 tasks marked [P] |

**Suggested MVP Scope**: Phase 1 + Phase 2 + User Story 1 (36 tasks)
